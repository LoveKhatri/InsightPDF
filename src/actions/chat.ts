"use server";

import { streamText } from 'ai';
import { google } from "@ai-sdk/google";
import { createStreamableValue } from '@ai-sdk/rsc';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { db } from "@/lib/db";
import { documents, embeddings } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-utils";
import { cosineDistance, eq, sql } from "drizzle-orm";

// Initialize embeddings (same as before)
const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "text-embedding-004",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function generateChatResponse(input: string, messages: any[]) {
    const stream = createStreamableValue('');
    const user = await getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    (async () => {
        try {
            // 1. Generate Embedding for Query
            const queryEmbedding = await geminiEmbeddings.embedQuery(input);

            // 2. Retrieve Relevant Chunks
            const similarity = sql<number>`1 - (${embeddings.embedding} <=> ${JSON.stringify(queryEmbedding)})`;
            const chunks = await db
                .select({
                    content: embeddings.content,
                    similarity: similarity,
                    title: documents.name, // Select the document title
                })
                .from(embeddings)
                .innerJoin(documents, eq(embeddings.documentId, documents.id))
                .where(eq(documents.userId, user.id))
                .orderBy(cosineDistance(embeddings.embedding, queryEmbedding))
                .limit(5);

            const context = chunks.map((chunk) => chunk.content).join("\n\n");

            // Extract unique source titles
            const uniqueSources = Array.from(new Set(chunks.map(chunk => chunk.title)));

            // Prepend sources if any were found
            if (uniqueSources.length > 0) {
                stream.update(`**Sources:** ${uniqueSources.map(s => `\`${s}\``).join(', ')}\n\n`);
            }

            // 3. Generate Response
            const { textStream } = streamText({
                model: google("gemini-2.0-flash-lite"),
                messages: [
                    ...messages.map((m: any) => ({
                        role: m.role,
                        content: m.content || (
                            Array.isArray(m.parts)
                                ? m.parts.map((p: any) => p.text).join('')
                                : ''
                        )
                    })).filter(m => m.content.trim() !== ''),
                    { role: 'user', content: input }
                ],
                system: `Identity: You are "InsightPDF Analyst," a specialized Document Intelligence Agent. Your sole purpose is to help the user extract insights, summaries, and answers from the provided document snippets.

The Golden Rule: You must act as a Grounded AI. You are only allowed to answer using the provided Context. If the user asks a question that cannot be answered by the context, you must politely state: "I'm sorry, but the current document does not contain information regarding that specific query. Is there something else from the file I can help with?"

Personality & Tone:

* Professional & Academic: Use clear, precise language.
* Concise: Do not use "filler" phrases like "Based on the text provided..." or "I found that...". Just state the facts directly.
* Structured: Use bullet points and bold text for key terms to make the information easy to scan.

Handling Edge Cases:

* No Context Found: If the retrieval step returns zero relevant chunks, notify the user that the document might not cover that topic.
* Conflicting Info: If two snippets contradict each other, present both views and note that they appear in different sections of the file.
* Off-Topic Questions: If the user asks about the weather or general knowledge outside the document, redirect them back to the PDF's content.


Here is the context from the document:
${context}`,
            });

            for await (const delta of textStream) {
                stream.update(delta);
            }

            stream.done();
        } catch (error) {
            console.error("Error in generateChatResponse:", error);
            stream.error(error);
        }
    })();

    return { output: stream.value };
}

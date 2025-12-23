import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { db } from "@/lib/db";
import { documents, embeddings } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-utils";
import { cosineDistance, desc, eq, sql, and } from "drizzle-orm";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Initialize Gemini Embeddings (Same config as ingestion)
const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "text-embedding-004",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const user = await getUser();
        if (!user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1];
        const query = lastMessage.content;

        // 1. Generate Embedding for Query
        const queryEmbedding = await geminiEmbeddings.embedQuery(query);

        // 2. Retrieve Relevant Chunks (Strict Scoping)
        // Cosine distance: lower is better.
        const similarity = sql<number>`1 - (${embeddings.embedding} <=> ${JSON.stringify(queryEmbedding)})`;

        const chunks = await db
            .select({
                content: embeddings.content,
                similarity: similarity,
            })
            .from(embeddings)
            .innerJoin(documents, eq(embeddings.documentId, documents.id))
            .where(eq(documents.userId, user.id))
            .orderBy(cosineDistance(embeddings.embedding, queryEmbedding))
            .limit(5);

        // 3. Construct Context
        const context = chunks.map((chunk) => chunk.content).join("\n\n");

        // 4. Generate Response
        const result = streamText({
            model: google("gemini-2.0-flash-exp"),
            messages,
            system: `You are a helpful assistant for InsightPDF. 
            Use the following context to answer the user's question. 
            If the answer is not in the context, say you don't know interactively.
            
            Context:
            ${context}`,
        });

        return result.toTextStreamResponse();

    } catch (error) {
        console.error("Chat error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

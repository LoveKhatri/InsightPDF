import { db } from "@/lib/db";
import { embeddings as embeddingsTable } from "@/lib/db/schema";
import { deleteFile } from "@/lib/r2";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// @ts-ignore
import pdf from "pdf-parse";
import { nanoid } from "nanoid";

// Initialize R2 Client (re-using config or importing if possible, but for isolation defining here or importing)
// Better to import from r2.ts but we need to access the GetObject stream.
// Assuming r2.ts exports the client as default or named 'r2'.
import r2 from "@/lib/r2";

// Initialize Gemini Embeddings
const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "text-embedding-004",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function processDocument(fileKey: string, documentId: string, userId: string) {
    try {
        console.log(`Processing document: ${fileKey}`);

        // 1. Download from R2
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
        });
        const response = await r2.send(command);
        const pdfBuffer = await response.Body?.transformToByteArray();

        if (!pdfBuffer) {
            throw new Error("Failed to download PDF from R2");
        }

        // 2. Parse PDF
        const data = await pdf(Buffer.from(pdfBuffer));
        const text = data.text;

        // 3. Split Text
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const chunks = await splitter.splitText(text);
        console.log(`Generated ${chunks.length} chunks`);

        // 4. Generate Embeddings & Store (Batch processing)
        const BATCH_SIZE = 5;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);

            // Generate embeddings
            const batchEmbeddings = await geminiEmbeddings.embedDocuments(batch);

            // Prepare DB records
            const records = batch.map((chunk: string, idx: number) => ({
                id: nanoid(),
                documentId: documentId,
                content: chunk,
                embedding: batchEmbeddings[idx],
            }));

            // Insert into Drizzle
            await db.insert(embeddingsTable).values(records);

            console.log(`Processed batch ${i / BATCH_SIZE + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`);

            // Rate limiting delay
            if (i + BATCH_SIZE < chunks.length) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }

        console.log("Document processing complete");

    } catch (error) {
        console.error("Error processing document:", error);
        // Cleanup: Delete file from R2 if processing fails
        await deleteFile(fileKey);
        // Optional: Delete document record from DB?
        // For now, just cleaning up storage.
        throw error;
    }
}

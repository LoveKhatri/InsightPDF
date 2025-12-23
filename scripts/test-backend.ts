import { config } from "dotenv";
config({ path: ".env" }); // Load env vars

import { uploadFile, deleteFile } from "../src/lib/r2";
import { processDocument } from "../src/lib/ai/rag";
import { db } from "../src/lib/db";
import { documents, embeddings } from "../src/lib/db/schema";
import { nanoid } from "nanoid";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { sql, eq, cosineDistance, desc } from "drizzle-orm";

async function main() {
    console.log("🚀 Starting Backend Verification...");

    const userId = "test-user-" + nanoid();
    const documentId = nanoid();
    const fileKey = `${userId}/${nanoid()}-test.pdf`;

    const fs = require("fs");
    const path = require("path");

    // Read local PDF
    const pdfPath = path.join(process.cwd(), "admitcard.pdf");
    if (!fs.existsSync(pdfPath)) {
        throw new Error("admitcard.pdf not found in project root!");
    }
    const pdfBuffer = fs.readFileSync(pdfPath);

    try {
        // 1. Test R2 Upload
        console.log(`\n📄 Step 1: Uploading test PDF to R2 (${fileKey})...`);
        const key = await uploadFile(fileKey, pdfBuffer, "application/pdf");
        console.log("✅ Upload successful.", key);

        // 2. Create DB Record (Documents)
        // We need a mock user first or just insert with a random ID if there's no FK constraint checking strictly against an auth table populated by a separate service 
        // (but `documents` references `user.id`).
        // We must create a mock user.
        console.log(`\n👤 Creating mock user (${userId})...`);
        await db.insert(require("../src/lib/db/schema").user).values({
            id: userId,
            name: "Test User",
            email: `test-${nanoid()}@example.com`,
            emailVerified: true
        });

        console.log(`\n💾 Step 2: Creating Document record...`);
        await db.insert(documents).values({
            id: documentId,
            userId: userId,
            name: "test-backend.pdf",
            fileKey: fileKey,
        });
        console.log("✅ Document record created.");

        // 3. Test RAG Processing (Ingestion)
        console.log(`\n⚙️ Step 3: Triggering RAG Processing...`);
        // This will download from R2, parse, split, embed, and store
        await processDocument(fileKey, documentId, userId);
        console.log("✅ RAG Processing completed.");

        // 4. Verify Embeddings in DB
        const storedEmbeddings = await db.select().from(embeddings).where(eq(embeddings.documentId, documentId));
        console.log(`\n📊 Stored ${storedEmbeddings.length} embedding chunks.`);
        if (storedEmbeddings.length === 0) throw new Error("No embeddings found!");

        // 5. Test Retrieval (Vector Search)
        console.log(`\n🔎 Step 4: Testing Vector Search...`);
        const query = "What is this document about?";

        const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
            modelName: "text-embedding-004",
            apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        });

        const queryEmbedding = await geminiEmbeddings.embedQuery(query);

        const similarity = sql<number>`1 - (${embeddings.embedding} <=> ${JSON.stringify(queryEmbedding)})`;
        const results = await db
            .select({
                content: embeddings.content,
                similarity: similarity,
            })
            .from(embeddings)
            .innerJoin(documents, eq(embeddings.documentId, documents.id))
            .where(eq(documents.userId, userId))
            .orderBy(cosineDistance(embeddings.embedding, queryEmbedding))
            .limit(1);

        console.log("✅ Search Result:", results[0]);

        console.log("\n🧹 Cleanup...");
        // Cleanup User (Cascade should handle docs and embeddings)
        // await db.delete(require("../src/lib/db/schema").user).where(eq(require("../src/lib/db/schema").user.id, userId));
        // Cleanup R2
        await deleteFile(fileKey);
        console.log("✅ Cleanup complete.");

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

main();

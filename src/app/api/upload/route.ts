import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { uploadFile } from "@/lib/r2";
import { processDocument } from "@/lib/ai/rag";
import { nanoid } from "nanoid";

export const maxDuration = 60; // Allow 1 minute for processing

export async function POST(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const files = formData.getAll("files");

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        const uploadedDocuments = [];

        for (const file of files) {
            if (file instanceof File) {
                if (file.type !== "application/pdf") {
                    continue; // Skip non-PDFs or handle error
                }

                const buffer = Buffer.from(await file.arrayBuffer());
                const fileKey = `${user.id}/${nanoid()}-${file.name}`; // Scoped by user

                // 1. Upload to R2
                await uploadFile(fileKey, buffer, file.type);

                // 2. Create DB Record
                const documentId = nanoid();
                await db.insert(documents).values({
                    id: documentId,
                    userId: user.id,
                    name: file.name,
                    fileKey: fileKey,
                });

                // 3. Process Document (RAG)
                // Awaiting here for simplicity; consider background jobs for production
                await processDocument(fileKey, documentId, user.id);

                uploadedDocuments.push({
                    id: documentId,
                    name: file.name,
                    status: "processed"
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Files uploaded and processed successfully",
            documents: uploadedDocuments
        });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

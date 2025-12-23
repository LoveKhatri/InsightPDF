import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || "",
        secretAccessKey: R2_SECRET_ACCESS_KEY || "",
    },
});

export async function uploadFile(key: string, buffer: Buffer, contentType: string) {
    if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not defined");

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    try {
        await r2.send(command);
        return key;
    } catch (error) {
        console.error("Error uploading to R2:", error);
        throw error;
    }
}

export async function deleteFile(key: string) {
    if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not defined");

    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });

    try {
        await r2.send(command);
    } catch (error) {
        console.error("Error deleting from R2:", error);
        throw error;
    }
}

export default r2;

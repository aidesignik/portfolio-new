import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createBlobStore } from "@/lib/blobStorage";

const STORAGE_DIR = process.env.DOCUMENT_STORAGE_DIR ?? path.join(process.cwd(), "storage/documents");

// Vercel's filesystem is read-only/ephemeral outside of a build, so
// production relies on Blob storage (BLOB_READ_WRITE_TOKEN); local dev
// falls back to disk so no Blob store is needed to run the app locally.
const blob = process.env.BLOB_READ_WRITE_TOKEN ? createBlobStore("documents") : null;

export async function save(relativePath: string, buffer: Buffer): Promise<string> {
  if (blob) {
    await blob.save(relativePath, buffer);
    return relativePath;
  }
  const fullPath = path.join(/* turbopackIgnore: true */ STORAGE_DIR, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return relativePath;
}

export async function read(relativePath: string): Promise<Buffer> {
  if (blob) return blob.read(relativePath);
  const fullPath = path.join(/* turbopackIgnore: true */ STORAGE_DIR, relativePath);
  return readFile(fullPath);
}

import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { createBlobStore } from "@/lib/blobStorage";

const STORAGE_DIR = process.env.DRIVER_DOC_STORAGE_DIR ?? path.join(process.cwd(), "storage/driver-docs");

// Vercel's filesystem is read-only/ephemeral outside of a build, so
// production relies on Blob storage (BLOB_READ_WRITE_TOKEN); local dev
// falls back to disk so no Blob store is needed to run the app locally.
const blob = process.env.BLOB_READ_WRITE_TOKEN ? createBlobStore("driver-docs") : null;

export async function save(filename: string, buffer: Buffer): Promise<void> {
  if (blob) return blob.save(filename, buffer);
  await mkdir(/* turbopackIgnore: true */ STORAGE_DIR, { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ STORAGE_DIR, filename), buffer);
}

export async function read(filename: string): Promise<Buffer> {
  if (blob) return blob.read(filename);
  return readFile(path.join(/* turbopackIgnore: true */ STORAGE_DIR, filename));
}

export async function remove(filename: string): Promise<void> {
  if (blob) return blob.remove(filename);
  await unlink(path.join(/* turbopackIgnore: true */ STORAGE_DIR, filename)).catch(() => {});
}

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const STORAGE_DIR = process.env.DOCUMENT_STORAGE_DIR ?? path.join(process.cwd(), "storage/documents");

export async function save(relativePath: string, buffer: Buffer): Promise<string> {
  const fullPath = path.join(/* turbopackIgnore: true */ STORAGE_DIR, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return relativePath;
}

export async function read(relativePath: string): Promise<Buffer> {
  const fullPath = path.join(/* turbopackIgnore: true */ STORAGE_DIR, relativePath);
  return readFile(fullPath);
}

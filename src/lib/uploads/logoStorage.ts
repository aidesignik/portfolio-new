import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const STORAGE_DIR = process.env.LOGO_STORAGE_DIR ?? path.join(process.cwd(), "storage/logos");

export async function save(filename: string, buffer: Buffer): Promise<void> {
  await mkdir(/* turbopackIgnore: true */ STORAGE_DIR, { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ STORAGE_DIR, filename), buffer);
}

export async function read(filename: string): Promise<Buffer> {
  return readFile(path.join(/* turbopackIgnore: true */ STORAGE_DIR, filename));
}

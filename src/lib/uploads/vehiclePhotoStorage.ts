import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const STORAGE_DIR = process.env.VEHICLE_PHOTO_STORAGE_DIR ?? path.join(process.cwd(), "storage/vehicle-photos");

export async function save(filename: string, buffer: Buffer): Promise<void> {
  await mkdir(/* turbopackIgnore: true */ STORAGE_DIR, { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ STORAGE_DIR, filename), buffer);
}

export async function read(filename: string): Promise<Buffer> {
  return readFile(path.join(/* turbopackIgnore: true */ STORAGE_DIR, filename));
}

export async function remove(filename: string): Promise<void> {
  await unlink(path.join(/* turbopackIgnore: true */ STORAGE_DIR, filename)).catch(() => {});
}

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { save } from "@/lib/uploads/vehicleDocStorage";
import { DOCUMENT_MIME_TO_EXT, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/uploads/documentTypes";

export async function POST(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }

  const ext = DOCUMENT_MIME_TO_EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "UNSUPPORTED_TYPE" }, { status: 400 });
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return NextResponse.json({ error: "TOO_LARGE" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // A vehicle may not exist yet (uploading documents while creating a new
  // one), and there can be several documents per vehicle, so this is keyed
  // by a random id rather than the vehicle's.
  const filename = `${session.user.id}-${randomUUID()}.${ext}`;
  await save(filename, buffer);

  return NextResponse.json({ url: `/api/carrier/vehicle-docs/${filename}` });
}

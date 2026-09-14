import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { save } from "@/lib/uploads/logoStorage";
import { IMAGE_MIME_TO_EXT, MAX_LOGO_SIZE_BYTES } from "@/lib/uploads/imageTypes";

export async function POST(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }

  const ext = IMAGE_MIME_TO_EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "UNSUPPORTED_TYPE" }, { status: 400 });
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return NextResponse.json({ error: "TOO_LARGE" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${session.user.id}.${ext}`;
  await save(filename, buffer);

  return NextResponse.json({ logoUrl: `/api/carrier/logo/${filename}` });
}

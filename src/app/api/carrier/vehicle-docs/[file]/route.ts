import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { read } from "@/lib/uploads/vehicleDocStorage";
import { DOCUMENT_EXT_TO_MIME } from "@/lib/uploads/documentTypes";

// Registration papers and inspection certificates are business-sensitive —
// private, same as driver-docs. Authorization is by filename prefix (every
// upload is named `{uploader's userId}-{random}.{ext}`) rather than a DB
// lookup, since a document uploaded while creating a new vehicle isn't
// attached to any Vehicle row yet — the preview needs to load before that
// row exists.
const SAFE_FILENAME = /^([a-zA-Z0-9_-]+?)-[a-zA-Z0-9_-]+\.(png|jpg|webp|pdf)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const { file } = await params;
  const match = file.match(SAFE_FILENAME);
  if (!match || match[1] !== session.user.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const ext = file.split(".").pop()!;
  try {
    const buffer = await read(file);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": DOCUMENT_EXT_TO_MIME[ext],
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}

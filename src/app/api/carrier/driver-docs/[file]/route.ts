import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { read } from "@/lib/uploads/driverDocStorage";
import { IMAGE_EXT_TO_MIME } from "@/lib/uploads/imageTypes";

// Unlike the logo/vehicle-photo routes, driver documents (ID cards, medical
// certificates) are sensitive personal data — this route is private.
// Authorization is by filename prefix (every upload is named
// `{uploader's userId}-{random}.{ext}`) rather than a DB lookup, since a
// document uploaded while creating a new driver isn't attached to any
// Driver row yet — the preview needs to load before that row exists.
const SAFE_FILENAME = /^([a-zA-Z0-9_-]+?)-[a-zA-Z0-9_-]+\.(png|jpg|webp)$/;

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
        "Content-Type": IMAGE_EXT_TO_MIME[ext],
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}

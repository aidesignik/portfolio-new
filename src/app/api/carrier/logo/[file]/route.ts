import { NextResponse } from "next/server";
import { read } from "@/lib/uploads/logoStorage";
import { IMAGE_EXT_TO_MIME } from "@/lib/uploads/imageTypes";

// Company logos are shown to clients browsing carriers, so this route is
// intentionally public (no auth check) — same as any other branding asset.
const SAFE_FILENAME = /^[a-zA-Z0-9_-]+\.(png|jpg|webp)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!SAFE_FILENAME.test(file)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const ext = file.split(".").pop()!;
  try {
    const buffer = await read(file);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": IMAGE_EXT_TO_MIME[ext],
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}

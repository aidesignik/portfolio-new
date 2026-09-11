import { NextResponse } from "next/server";
import { auth } from "@/auth/auth";
import { estimateTripDistance } from "@/lib/tripDistance";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const pickupAddress = body?.pickupAddress;
  const destinationAddress = body?.destinationAddress;
  if (typeof pickupAddress !== "string" || typeof destinationAddress !== "string") {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    const estimate = await estimateTripDistance(pickupAddress, destinationAddress);
    if (!estimate) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(estimate);
  } catch {
    return NextResponse.json({ error: "ESTIMATE_FAILED" }, { status: 502 });
  }
}

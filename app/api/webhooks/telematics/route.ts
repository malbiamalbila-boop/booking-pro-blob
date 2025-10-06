import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { ingestTelematics } from "@/lib/telematics/processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.TELEMATICS_WEBHOOK_SECRET ?? "";
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (signature !== expected) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  await ingestTelematics({
    deviceId: payload.deviceId,
    vehicleId: payload.vehicleId,
    type: payload.type,
    recordedAt: payload.recordedAt,
    data: payload,
  });

  return NextResponse.json({ status: "accepted" }, { status: 202 });
}

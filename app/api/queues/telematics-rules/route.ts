import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json();
  console.info("Telematics rule job", payload);
  return NextResponse.json({ status: "ok" });
}

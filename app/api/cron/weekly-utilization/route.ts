import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  console.info("Running weekly utilization report");
  return NextResponse.json({ ok: true });
}

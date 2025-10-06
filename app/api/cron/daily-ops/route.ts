import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  console.info("Running daily ops digest");
  return NextResponse.json({ ok: true });
}

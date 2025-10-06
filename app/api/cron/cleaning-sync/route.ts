import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  console.info("Running cleaning sync");
  return NextResponse.json({ ok: true });
}

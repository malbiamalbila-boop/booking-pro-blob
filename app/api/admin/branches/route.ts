import { NextResponse } from "next/server";
import { z } from "@/lib/validation";
import { db } from "@/lib/db/client";
import { branches } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string(),
  name: z.string(),
  city: z.string().optional(),
  address: z.string().optional(),
});

export async function GET() {
  const rows = await db.select().from(branches);
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parse = schema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const [record] = await db.insert(branches).values(parse.data).returning();
  return NextResponse.json(record, { status: 201 });
}

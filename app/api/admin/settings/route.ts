import { NextResponse } from "next/server";
import { z } from "@/lib/validation";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  key: z.string(),
  value: z.unknown(),
});

export async function GET() {
  const rows = await db.select().from(settings);
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parse = schema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const existing = await db.select().from(settings).where(eq(settings.key, parse.data.key));
  if (existing.length) {
    const [record] = await db
      .update(settings)
      .set({ value: parse.data.value })
      .where(eq(settings.key, parse.data.key))
      .returning();
    return NextResponse.json(record);
  }
  const [record] = await db.insert(settings).values(parse.data).returning();
  return NextResponse.json(record, { status: 201 });
}

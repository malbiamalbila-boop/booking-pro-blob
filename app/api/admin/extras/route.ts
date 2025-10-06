import { NextResponse } from "next/server";
import { z } from "@/lib/validation";
import { db } from "@/lib/db/client";
import { extras } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string(),
  name: z.string(),
  dailyPrice: z.number().optional(),
  flatPrice: z.number().optional(),
  requiresInternational: z.boolean().optional(),
});

export async function GET() {
  const rows = await db.select().from(extras);
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parse = schema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const [record] = await db
    .insert(extras)
    .values({
      ...parse.data,
      dailyPrice: parse.data.dailyPrice?.toFixed(2),
      flatPrice: parse.data.flatPrice?.toFixed(2),
    })
    .returning();
  return NextResponse.json(record, { status: 201 });
}

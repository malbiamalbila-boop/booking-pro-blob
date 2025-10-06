import { NextResponse } from "next/server";
import { z } from "@/lib/validation";
import { db } from "@/lib/db/client";
import { prices } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  ratePlanId: z.string(),
  vehicleClassId: z.string(),
  baseAmount: z.number(),
  weekendMultiplier: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET() {
  const rows = await db.select().from(prices);
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parse = schema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const [record] = await db
    .insert(prices)
    .values({
      ...parse.data,
      baseAmount: parse.data.baseAmount.toFixed(2),
      weekendMultiplier: parse.data.weekendMultiplier?.toString(),
    })
    .returning();
  return NextResponse.json(record, { status: 201 });
}

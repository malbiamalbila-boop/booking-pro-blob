import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { vehicles } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  vin: z.string(),
  plate: z.string(),
  displayName: z.string(),
  branchId: z.string().optional(),
  vehicleClassId: z.string(),
  status: z.string().optional(),
});

export async function GET() {
  const rows = await db.select().from(vehicles).limit(100);
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parse = createSchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const [record] = await db.insert(vehicles).values(parse.data).returning();
  return NextResponse.json(record, { status: 201 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { vehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  displayName: z.string().optional(),
  status: z.string().optional(),
  branchId: z.string().optional(),
});

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const json = await request.json().catch(() => null);
  const parse = patchSchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const [record] = await db.update(vehicles).set(parse.data).where(eq(vehicles.id, context.params.id)).returning();
  if (!record) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(record);
}

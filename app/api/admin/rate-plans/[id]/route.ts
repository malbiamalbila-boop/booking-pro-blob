import { NextResponse } from "next/server";
import { z } from "@/lib/validation";
import { db } from "@/lib/db/client";
import { ratePlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const json = await request.json().catch(() => null);
  const parse = schema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const [record] = await db.update(ratePlans).set(parse.data).where(eq(ratePlans.id, context.params.id)).returning();
  if (!record) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(record);
}

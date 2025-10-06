import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users, userRoles } from "@/lib/db/schema";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(6).optional(),
  branchId: z.string().optional(),
  roles: z.array(z.string()).optional(),
});

export async function GET() {
  const rows = await db.select().from(users);
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parse = schema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const payload = parse.data;
  const [record] = await db
    .insert(users)
    .values({
      email: payload.email,
      name: payload.name,
      branchId: payload.branchId,
      passwordHash: payload.password ? createHash("sha256").update(payload.password).digest("hex") : null,
    })
    .returning();

  if (payload.roles?.length) {
    for (const roleId of payload.roles) {
      await db.insert(userRoles).values({ userId: record.id, roleId }).onConflictDoNothing();
    }
  }

  return NextResponse.json(record, { status: 201 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { reservations, handoverChecks, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  odometer: z.number().optional(),
  fuelLevel: z.number().int().min(0).max(100).optional(),
  cleanliness: z.string().optional(),
  photos: z.array(z.string()).optional(),
  damages: z.array(z.object({ description: z.string(), severity: z.string().optional() })).optional(),
  signatureBlob: z.string().optional(),
  notes: z.string().optional(),
  performedBy: z.string().optional(),
});

export async function POST(request: Request, context: { params: { reservationId: string } }) {
  const { reservationId } = context.params;
  const json = await request.json().catch(() => null);
  const parse = bodySchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const [reservation] = await db.select().from(reservations).where(eq(reservations.id, reservationId));
  if (!reservation) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const payload = parse.data;
  const [record] = await db
    .insert(handoverChecks)
    .values({
      reservationId,
      type: "checkout",
      odometer: payload.odometer,
      fuelLevel: payload.fuelLevel,
      cleanliness: payload.cleanliness,
      photos: payload.photos,
      damages: payload.damages,
      signatureBlob: payload.signatureBlob,
      internalChargesNote: payload.notes,
      performedBy: payload.performedBy,
    })
    .returning();

  await db.insert(auditLogs).values({
    actorId: payload.performedBy ?? null,
    action: "handover.checkout",
    entity: "reservation",
    entityId: reservationId,
    after: { record },
  });

  return NextResponse.json(record, { status: 200 });
}

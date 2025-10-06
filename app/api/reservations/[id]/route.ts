import { NextResponse } from "next/server";
import { z } from "@/lib/validation";
import { db } from "@/lib/db/client";
import { reservations, reservationItems, handoverChecks, documents, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.string().optional(),
  pickupAt: z.string().datetime().optional(),
  dropoffAt: z.string().datetime().optional(),
  vehicleId: z.string().optional(),
  totalAmount: z.number().optional(),
  internalNotes: z.string().optional(),
});

export async function GET(_: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  const [reservation] = await db
    .select({
      reservation: reservations,
      items: reservationItems,
      handovers: handoverChecks,
      docs: documents,
    })
    .from(reservations)
    .leftJoin(reservationItems, eq(reservations.id, reservationItems.reservationId))
    .leftJoin(handoverChecks, eq(reservations.id, handoverChecks.reservationId))
    .leftJoin(documents, eq(reservations.id, documents.reservationId))
    .where(eq(reservations.id, id));

  if (!reservation) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(reservation);
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  const json = await request.json().catch(() => null);
  const parse = patchSchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const payload = parse.data;
  const update: any = {};
  if (payload.status) update.status = payload.status;
  if (payload.pickupAt) update.pickupAt = new Date(payload.pickupAt);
  if (payload.dropoffAt) update.dropoffAt = new Date(payload.dropoffAt);
  if (payload.totalAmount !== undefined) update.totalAmount = payload.totalAmount;
  if (payload.internalNotes !== undefined) update.internalNotes = payload.internalNotes;

  const [updated] = await db.update(reservations).set(update).where(eq(reservations.id, id)).returning();
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (payload.vehicleId) {
    await db
      .update(reservationItems)
      .set({ vehicleId: payload.vehicleId })
      .where(eq(reservationItems.reservationId, id));
  }

  await db.insert(auditLogs).values({
    actorId: null,
    action: "reservation.update",
    entity: "reservation",
    entityId: id,
    after: { update: payload },
  });

  return NextResponse.json(updated);
}

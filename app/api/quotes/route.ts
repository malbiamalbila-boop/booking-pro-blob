import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { reservations, reservationItems, auditLogs } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  pickupBranchId: z.string(),
  dropoffBranchId: z.string(),
  pickupAt: z.string().datetime(),
  dropoffAt: z.string().datetime(),
  customerId: z.string().optional(),
  vehicleClassId: z.string(),
  ratePlanId: z.string().optional(),
  price: z.number(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parse = bodySchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const payload = parse.data;

  const quoteId = randomUUID();
  const expires = new Date(Date.now() + 6 * 60 * 60 * 1000);
  const [reservation] = await db
    .insert(reservations)
    .values({
      id: quoteId,
      code: `Q-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: "inquiry",
      pickupBranchId: payload.pickupBranchId,
      dropoffBranchId: payload.dropoffBranchId,
      pickupAt: new Date(payload.pickupAt),
      dropoffAt: new Date(payload.dropoffAt),
      customerId: payload.customerId,
      ratePlanId: payload.ratePlanId,
      quoteExpiresAt: expires,
      totalAmount: payload.price,
      customerNotes: payload.notes,
    })
    .returning();

  await db.insert(reservationItems).values({
    reservationId: reservation.id,
    vehicleClassId: payload.vehicleClassId,
    startsAt: new Date(payload.pickupAt),
    endsAt: new Date(payload.dropoffAt),
    totalAmount: payload.price,
    priceSnapshot: {
      base: payload.price,
      currency: "BAM",
      expiresAt: expires.toISOString(),
    },
  });

  await db.insert(auditLogs).values({
    actorId: null,
    action: "quote.create",
    entity: "reservation",
    entityId: reservation.id,
    after: { reservation },
  });

  return NextResponse.json({ quoteId: reservation.id, expiresAt: expires.toISOString() }, { status: 201 });
}

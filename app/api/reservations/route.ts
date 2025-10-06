import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { reservations, reservationItems, vehicles, customers, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  quoteId: z.string().optional(),
  pickupBranchId: z.string(),
  dropoffBranchId: z.string(),
  pickupAt: z.string().datetime(),
  dropoffAt: z.string().datetime(),
  customerId: z.string().optional(),
  vehicleId: z.string().optional(),
  vehicleClassId: z.string(),
  ratePlanId: z.string().optional(),
  totalAmount: z.number(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const query = db
    .select({
      id: reservations.id,
      code: reservations.code,
      status: reservations.status,
      pickupAt: reservations.pickupAt,
      dropoffAt: reservations.dropoffAt,
      totalAmount: reservations.totalAmount,
      vehicleClassId: reservationItems.vehicleClassId,
      vehicleId: reservationItems.vehicleId,
      vehicleName: vehicles.displayName,
      customerName: customers.fullName,
    })
    .from(reservations)
    .leftJoin(reservationItems, eq(reservations.id, reservationItems.reservationId))
    .leftJoin(vehicles, eq(reservationItems.vehicleId, vehicles.id))
    .leftJoin(customers, eq(reservations.customerId, customers.id));

  const results = status ? await query.where(eq(reservations.status, status as any)) : await query;
  return NextResponse.json({ reservations: results });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parse = createSchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const payload = parse.data;
  const [reservation] = await db
    .insert(reservations)
    .values({
      code: payload.quoteId ?? `RSV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: "confirmed",
      pickupBranchId: payload.pickupBranchId,
      dropoffBranchId: payload.dropoffBranchId,
      pickupAt: new Date(payload.pickupAt),
      dropoffAt: new Date(payload.dropoffAt),
      customerId: payload.customerId,
      ratePlanId: payload.ratePlanId,
      totalAmount: payload.totalAmount,
      internalNotes: payload.notes,
    })
    .returning();

  await db.insert(reservationItems).values({
    reservationId: reservation.id,
    vehicleClassId: payload.vehicleClassId,
    vehicleId: payload.vehicleId,
    startsAt: new Date(payload.pickupAt),
    endsAt: new Date(payload.dropoffAt),
    totalAmount: payload.totalAmount,
    priceSnapshot: {
      base: payload.totalAmount,
      currency: "BAM",
    },
  });

  await db.insert(auditLogs).values({
    actorId: null,
    action: "reservation.create",
    entity: "reservation",
    entityId: reservation.id,
    after: { reservation },
  });

  return NextResponse.json(reservation, { status: 201 });
}

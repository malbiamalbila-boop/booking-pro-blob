import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { reservations, reservationItems, vehicles, vehicleClasses } from "@/lib/db/schema";
import { and, eq, gte, lte, or } from "drizzle-orm";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  pickup_branch: z.string().optional(),
  dropoff_branch: z.string().optional(),
  class: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parse = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const { from, to, pickup_branch, class: classCode } = parse.data;
  const start = new Date(from);
  const end = new Date(to);

  const vehiclesResult = await db
    .select({
      id: vehicles.id,
      branchId: vehicles.branchId,
      classId: vehicles.vehicleClassId,
      classCode: vehicleClasses.code,
      displayName: vehicles.displayName,
    })
    .from(vehicles)
    .innerJoin(vehicleClasses, eq(vehicles.vehicleClassId, vehicleClasses.id));

  const conflicts = await db
    .select({ vehicleId: reservationItems.vehicleId })
    .from(reservationItems)
    .innerJoin(reservations, eq(reservations.id, reservationItems.reservationId))
    .where(
      and(
        or(
          and(lte(reservationItems.startsAt, start), gte(reservationItems.endsAt, start)),
          and(lte(reservationItems.startsAt, end), gte(reservationItems.endsAt, end)),
          and(gte(reservationItems.startsAt, start), lte(reservationItems.endsAt, end))
        )
      )
    );

  const busyVehicles = new Set(conflicts.map((row) => row.vehicleId!).filter(Boolean));
  const availability = resolveAvailability(vehiclesResult, busyVehicles, {
    pickupBranch: pickup_branch,
    classCode,
  });

  return NextResponse.json({ availability });
}

type VehicleRow = {
  id: string;
  branchId: string | null;
  classCode: string;
  displayName: string;
};

type Filters = {
  pickupBranch?: string | null;
  classCode?: string | null;
};

export function resolveAvailability(vehicles: VehicleRow[], busyVehicles: Set<string>, filters: Filters) {
  return vehicles
    .filter((vehicle) => {
      if (filters.pickupBranch && vehicle.branchId !== filters.pickupBranch) return false;
      if (filters.classCode && vehicle.classCode !== filters.classCode) return false;
      return !busyVehicles.has(vehicle.id);
    })
    .map((vehicle) => ({
      vehicleId: vehicle.id,
      classCode: vehicle.classCode,
      displayName: vehicle.displayName,
      score: 1,
      notes: busyVehicles.has(vehicle.id) ? "Occupied" : "Available",
    }));
}

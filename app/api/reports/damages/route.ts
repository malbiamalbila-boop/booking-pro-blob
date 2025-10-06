import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { damages, vehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";
export const revalidate = 60;

export async function GET() {
  const rows = await db
    .select({
      id: damages.id,
      reservationId: damages.reservationId,
      vehicleId: damages.vehicleId,
      description: damages.description,
      severity: damages.severity,
      status: damages.status,
      estimateAmount: damages.estimateAmount,
    })
    .from(damages);
  return NextResponse.json({ data: rows });
}

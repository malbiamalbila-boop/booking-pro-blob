import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { reservations, vehicles } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "edge";
export const revalidate = 60;

export async function GET() {
  const rows = await db.execute(sql`
    SELECT
      vehicles.id,
      vehicles.display_name,
      COUNT(reservations.id)::int AS reservations,
      SUM(EXTRACT(EPOCH FROM (reservations.dropoff_at - reservations.pickup_at)))/3600 AS hours
    FROM vehicles
    LEFT JOIN reservation_items ON reservation_items.vehicle_id = vehicles.id
    LEFT JOIN reservations ON reservations.id = reservation_items.reservation_id
      AND reservations.status IN ('confirmed','closed')
    GROUP BY vehicles.id, vehicles.display_name
  `);
  return NextResponse.json({ data: rows.rows });
}

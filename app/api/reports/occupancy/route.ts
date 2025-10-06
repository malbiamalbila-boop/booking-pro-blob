import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { reservations } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "edge";
export const revalidate = 60;

export async function GET() {
  const rows = await db.execute(sql`
    SELECT date_trunc('day', pickup_at) AS day, count(*)::int AS reservations
    FROM reservations
    WHERE status IN ('confirmed','closed')
    GROUP BY day
    ORDER BY day DESC
    LIMIT 14
  `);
  return NextResponse.json({ data: rows.rows });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { reservations } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(reservations).limit(100);
  const header = Object.keys(rows[0] ?? {}).join(",");
  const body = rows
    .map((row) =>
      Object.values(row)
        .map((value) => (value == null ? "" : JSON.stringify(value)))
        .join(",")
    )
    .join("\n");
  const csv = [header, body].filter(Boolean).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=reservations.csv",
    },
  });
}

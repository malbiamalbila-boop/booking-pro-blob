import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { reservationItems, reservations, vehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";
export const revalidate = 60;

export async function GET(_: Request, context: { params: { vehicleId: string } }) {
  const rawId = context.params.vehicleId.replace(/\.ics$/, "");
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, rawId));
  if (!vehicle) {
    return new NextResponse("NOT FOUND", { status: 404 });
  }

  const items = await db
    .select({
      reservationId: reservationItems.reservationId,
      startsAt: reservationItems.startsAt,
      endsAt: reservationItems.endsAt,
      status: reservations.status,
    })
    .from(reservationItems)
    .innerJoin(reservations, eq(reservations.id, reservationItems.reservationId))
    .where(eq(reservationItems.vehicleId, rawId));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookingPro Fleet//EN",
    `X-WR-CALNAME:${vehicle.displayName}`,
  ];

  for (const item of items) {
    const uid = `${item.reservationId}@bookingpro`;
    const start = formatDate(item.startsAt);
    const end = formatDate(item.endsAt);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${item.status.toUpperCase()} reservation`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}

function formatDate(value: Date | null) {
  if (!value) return "";
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

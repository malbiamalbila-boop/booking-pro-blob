import Link from "next/link";
import { db } from "@/lib/db/client";
import { reservations, reservationItems, vehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getSchedule() {
  const rows = await db
    .select({
      id: reservations.id,
      code: reservations.code,
      status: reservations.status,
      pickupAt: reservations.pickupAt,
      dropoffAt: reservations.dropoffAt,
      pickupBranchId: reservations.pickupBranchId,
      dropoffBranchId: reservations.dropoffBranchId,
      vehicleName: vehicles.displayName,
    })
    .from(reservations)
    .leftJoin(reservationItems, eq(reservations.id, reservationItems.reservationId))
    .leftJoin(vehicles, eq(reservationItems.vehicleId, vehicles.id))
    .orderBy(reservations.pickupAt)
    .limit(50);
  return rows;
}

export const revalidate = 30;

export default async function SchedulePage() {
  const rows = await getSchedule();
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="badge">Ops</p>
            <h1 className="mt-2 text-2xl font-semibold">Turn-around schema</h1>
            <p className="text-sm text-slate-500">
              Lista över kommande upphämtningar och återlämningar för att koordinera städ, service och leveranser.
            </p>
          </div>
          <Link href="/" className="button-secondary">
            Tillbaka till dashboard
          </Link>
        </div>
        <div className="surface-card">
          <table className="table">
            <thead>
              <tr>
                <th>Reservation</th>
                <th>Status</th>
                <th>Pickup</th>
                <th>Return</th>
                <th>Fordon</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/reservations/${row.id}`} className="text-indigo-600 hover:underline">
                      {row.code}
                    </Link>
                  </td>
                  <td className="uppercase text-xs font-semibold text-slate-500">{row.status}</td>
                  <td>{row.pickupAt?.toLocaleString("sv-SE")}</td>
                  <td>{row.dropoffAt?.toLocaleString("sv-SE")}</td>
                  <td>{row.vehicleName ?? "Ej tilldelad"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Inga schemalagda händelser
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { db } from "@/lib/db/client";
import { reservations, vehicles, customers } from "@/lib/db/schema";
import { getReservationBadge } from "@/lib/reservations/status";
import { sql } from "drizzle-orm";

async function getDashboardData() {
  const [reservationCount, vehicleCount, customerCount] = await Promise.all([
    db.execute(sql`SELECT count(*)::int AS total FROM reservations WHERE status IN ('confirmed','inquiry')`),
    db.execute(sql`SELECT count(*)::int AS total FROM vehicles`),
    db.execute(sql`SELECT count(*)::int AS total FROM customers`),
  ]);

  const upcoming = await db
    .select({
      id: reservations.id,
      code: reservations.code,
      pickupAt: reservations.pickupAt,
      dropoffAt: reservations.dropoffAt,
      status: reservations.status,
      totalAmount: reservations.totalAmount,
    })
    .from(reservations)
    .orderBy(reservations.pickupAt)
    .limit(5);

  return {
    reservationCount: reservationCount.rows[0]?.total ?? 0,
    vehicleCount: vehicleCount.rows[0]?.total ?? 0,
    customerCount: customerCount.rows[0]?.total ?? 0,
    upcoming,
  };
}

export default async function HomePage() {
  const data = await getDashboardData();
  return (
    <main className="app-shell">
      <aside className="sidebar-card">
        <div>
          <div className="badge">Control Tower</div>
          <h1 className="text-2xl font-semibold">Fleet Operations</h1>
          <p className="text-sm text-slate-500">
            Intern planeringspanel för Sarajevos biluthyrning – reservera, leverera och följ upp skador utan betalningsflöden.
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          <Link className="nav-link" data-active="true" href="/">
            Dashboard
          </Link>
          <Link className="nav-link" href="/ops/schedule">
            Operationsschema
          </Link>
          <Link className="nav-link" href="/reservations/new">
            Ny reservation
          </Link>
          <Link className="nav-link" href="/admin/overview">
            Admin & Policys
          </Link>
        </nav>
      </aside>
      <section className="surface-card">
        <div className="top-toolbar">
          <h2 className="text-xl font-semibold">Översikt</h2>
          <Link href="/reservations/new" className="button">
            Skapa reservation
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="list-tile">
            <div>
              <p className="text-xs uppercase text-slate-500">Aktiva förfrågningar</p>
              <p className="text-2xl font-semibold">{data.reservationCount}</p>
            </div>
            <span className="badge">Reservations</span>
          </div>
          <div className="list-tile">
            <div>
              <p className="text-xs uppercase text-slate-500">Fordon i flottan</p>
              <p className="text-2xl font-semibold">{data.vehicleCount}</p>
            </div>
            <span className="badge">Fleet</span>
          </div>
          <div className="list-tile">
            <div>
              <p className="text-xs uppercase text-slate-500">Kunder</p>
              <p className="text-2xl font-semibold">{data.customerCount}</p>
            </div>
            <span className="badge">CRM</span>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Kommande upphämtningar</h3>
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="table">
              <thead>
                <tr>
                  <th>Kod</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>Slut</th>
                  <th>Total (BAM)</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/reservations/${item.id}`} className="text-indigo-600 hover:underline">
                        {item.code}
                      </Link>
                    </td>
                    <td className="uppercase text-xs font-semibold text-slate-500">
                      <span data-variant={getReservationBadge(item.status as any)}>{item.status}</span>
                    </td>
                    <td>{item.pickupAt?.toLocaleString("sv-SE")}</td>
                    <td>{item.dropoffAt?.toLocaleString("sv-SE")}</td>
                    <td>{item.totalAmount?.toString() ?? "-"}</td>
                  </tr>
                ))}
                {!data.upcoming.length && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Inga kommande uthämtningar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <aside className="sidebar-card hidden xl:flex">
        <div>
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Snabbgenvägar</h3>
          <div className="flex flex-col gap-2">
            <Link href="/ops/schedule" className="button-secondary">
              Se turn-around plan
            </Link>
            <Link href="/admin/overview" className="button-secondary">
              Hantera policies
            </Link>
            <a href="/api/export/csv" className="button-secondary">
              Exportera CSV
            </a>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Rapporter</h3>
          <ul className="flex flex-col gap-2 text-sm text-slate-600">
            <li>
              <a href="/api/reports/occupancy" className="text-indigo-600 hover:underline">
                Beläggning (14 dagar)
              </a>
            </li>
            <li>
              <a href="/api/reports/utilization" className="text-indigo-600 hover:underline">
                Utnyttjande per bil
              </a>
            </li>
            <li>
              <a href="/api/reports/damages" className="text-indigo-600 hover:underline">
                Skadeöversikt
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </main>
  );
}

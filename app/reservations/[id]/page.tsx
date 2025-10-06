import Link from "next/link";
import { db } from "@/lib/db/client";
import {
  reservations,
  reservationItems,
  customers,
  vehicles,
  handoverChecks,
  documents,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getReservation(id: string) {
  const [reservation] = await db
    .select({
      reservation: reservations,
      item: reservationItems,
      customer: customers,
      vehicle: vehicles,
    })
    .from(reservations)
    .leftJoin(reservationItems, eq(reservations.id, reservationItems.reservationId))
    .leftJoin(customers, eq(reservations.customerId, customers.id))
    .leftJoin(vehicles, eq(reservationItems.vehicleId, vehicles.id))
    .where(eq(reservations.id, id));
  if (!reservation) return null;
  const checks = await db.select().from(handoverChecks).where(eq(handoverChecks.reservationId, id));
  const docs = await db.select().from(documents).where(eq(documents.reservationId, id));
  return { reservation, checks, docs };
}

export default async function ReservationDetail({ params }: { params: { id: string } }) {
  const data = await getReservation(params.id);
  if (!data) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <p className="text-sm text-slate-500">Reservationen hittades inte.</p>
          <Link href="/" className="button-secondary">
            Tillbaka
          </Link>
        </div>
      </main>
    );
  }

  const res = data.reservation.reservation;
  const item = data.reservation.item;
  const customer = data.reservation.customer;
  const vehicle = data.reservation.vehicle;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="badge">Reservation</p>
            <h1 className="mt-2 text-2xl font-semibold">{res.code}</h1>
            <p className="text-sm text-slate-500">
              Status: <span className="uppercase">{res.status}</span>
            </p>
          </div>
          <Link href="/" className="button-secondary">
            Tillbaka
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="surface-card space-y-3">
            <h2 className="text-sm font-semibold uppercase text-slate-500">Resa</h2>
            <div className="text-sm">
              <p>
                <strong>Pickup:</strong> {res.pickupAt?.toLocaleString("sv-SE")}
              </p>
              <p>
                <strong>Return:</strong> {res.dropoffAt?.toLocaleString("sv-SE")}
              </p>
              <p>
                <strong>Belopp:</strong> {res.totalAmount?.toString() ?? "-"} BAM
              </p>
            </div>
          </div>
          <div className="surface-card space-y-3">
            <h2 className="text-sm font-semibold uppercase text-slate-500">Kund & Fordon</h2>
            <div className="text-sm">
              <p>
                <strong>Kund:</strong> {customer?.fullName ?? "Ej satt"}
              </p>
              <p>
                <strong>Fordonsklass:</strong> {item?.vehicleClassId ?? "-"}
              </p>
              <p>
                <strong>Fordon:</strong> {vehicle?.displayName ?? "Ej tilldelad"}
              </p>
            </div>
          </div>
        </div>

        <section className="surface-card space-y-3">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Handover</h2>
          <div className="space-y-2">
            {data.checks.map((check) => (
              <div key={check.id} className="list-tile">
                <div>
                  <p className="text-xs uppercase text-slate-500">{check.type}</p>
                  <p className="text-sm">
                    Odometer: {check.odometer ?? "-"} · Bränsle: {check.fuelLevel ?? "-"}%
                  </p>
                  {check.internalChargesNote && (
                    <p className="text-xs text-slate-500">{check.internalChargesNote}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {check.createdAt?.toLocaleString("sv-SE")}
                </span>
              </div>
            ))}
            {!data.checks.length && <p className="text-sm text-slate-500">Ingen handover registrerad ännu.</p>}
          </div>
        </section>

        <section className="surface-card space-y-3">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Dokument</h2>
          <ul className="space-y-2 text-sm">
            {data.docs.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2">
                <span>{doc.title ?? doc.type}</span>
                <a href={`https://blob.vercel.com/${doc.blobKey}`} className="text-indigo-600 hover:underline">
                  Visa
                </a>
              </li>
            ))}
            {!data.docs.length && <li className="text-sm text-slate-500">Inga dokument uppladdade.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}

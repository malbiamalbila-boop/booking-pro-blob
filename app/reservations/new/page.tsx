import { revalidatePath } from "next/cache";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { branches, customers, vehicleClasses } from "@/lib/db/schema";
import { getPricingQuote } from "@/lib/pricing/engine";
import { reservations, reservationItems } from "@/lib/db/schema";

async function loadFormData() {
  const [branchRows, classRows, customerRows] = await Promise.all([
    db.select().from(branches),
    db.select().from(vehicleClasses),
    db.select().from(customers).limit(25),
  ]);
  return { branches: branchRows, classes: classRows, customers: customerRows };
}

async function createReservation(formData: FormData) {
  "use server";
  const pickupBranchId = formData.get("pickupBranchId") as string;
  const dropoffBranchId = formData.get("dropoffBranchId") as string;
  const pickupAt = new Date(formData.get("pickupAt") as string);
  const dropoffAt = new Date(formData.get("dropoffAt") as string);
  const vehicleClassId = formData.get("vehicleClassId") as string;
  const customerId = formData.get("customerId") as string | null;
  const ratePlanId = formData.get("ratePlanId") as string | null;

  const quote = await getPricingQuote({ vehicleClassId, pickupAt, dropoffAt, ratePlanId: ratePlanId ?? undefined });

  const [reservation] = await db
    .insert(reservations)
    .values({
      code: `RSV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: "confirmed",
      pickupBranchId,
      dropoffBranchId,
      pickupAt,
      dropoffAt,
      customerId: customerId || undefined,
      ratePlanId: ratePlanId || undefined,
      totalAmount: quote.totals.total,
    })
    .returning();

  await db.insert(reservationItems).values({
    reservationId: reservation.id,
    vehicleClassId,
    startsAt: pickupAt,
    endsAt: dropoffAt,
    totalAmount: quote.totals.total,
    priceSnapshot: quote,
  });

  revalidatePath("/reservations/new");
  return reservation.id;
}

export default async function NewReservationPage() {
  const data = await loadFormData();
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="badge">Reservations</p>
            <h1 className="mt-2 text-2xl font-semibold">Skapa intern reservation</h1>
            <p className="text-sm text-slate-500">
              Priser beräknas informativt och sparas som snapshot utan betalningsflöde.
            </p>
          </div>
          <Link href="/" className="button-secondary">
            Avbryt
          </Link>
        </div>
        <form action={createReservation} className="surface-card space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="pickupBranchId">Uthämtningskontor</label>
              <select id="pickupBranchId" name="pickupBranchId" className="select" required>
                {data.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dropoffBranchId">Återlämningskontor</label>
              <select id="dropoffBranchId" name="dropoffBranchId" className="select" required>
                {data.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pickupAt">Uthämtning</label>
              <input id="pickupAt" name="pickupAt" type="datetime-local" className="input" required />
            </div>
            <div className="field">
              <label htmlFor="dropoffAt">Återlämning</label>
              <input id="dropoffAt" name="dropoffAt" type="datetime-local" className="input" required />
            </div>
            <div className="field">
              <label htmlFor="vehicleClassId">Fordonsklass</label>
              <select id="vehicleClassId" name="vehicleClassId" className="select" required>
                {data.classes.map((vehicleClass) => (
                  <option key={vehicleClass.id} value={vehicleClass.id}>
                    {vehicleClass.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="customerId">Kund</label>
              <select id="customerId" name="customerId" className="select">
                <option value="">Välj kund</option>
                {data.customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="field sm:col-span-2">
              <label htmlFor="ratePlanId">Rate plan (valfri)</label>
              <input id="ratePlanId" name="ratePlanId" className="input" placeholder="Ange rate plan id" />
            </div>
          </div>
          <button type="submit" className="button">
            Bekräfta reservation
          </button>
        </form>
      </div>
    </main>
  );
}

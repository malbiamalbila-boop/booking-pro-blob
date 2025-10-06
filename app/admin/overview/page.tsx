import Link from "next/link";
import { db } from "@/lib/db/client";
import { settings, ratePlans, extras, branches } from "@/lib/db/schema";

async function loadAdminData() {
  const [policyRows, planRows, extraRows, branchRows] = await Promise.all([
    db.select().from(settings),
    db.select().from(ratePlans),
    db.select().from(extras),
    db.select().from(branches),
  ]);
  return { policyRows, planRows, extraRows, branchRows };
}

export default async function AdminOverview() {
  const data = await loadAdminData();
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="badge">Admin</p>
            <h1 className="mt-2 text-2xl font-semibold">Policy & Rate Console</h1>
            <p className="text-sm text-slate-500">
              Uppdatera interna regler, filialer, rate plans och tillval. Ändringar gäller endast för interna bokningsflöden.
            </p>
          </div>
          <Link href="/" className="button-secondary">
            Tillbaka
          </Link>
        </div>
        <section className="surface-card space-y-3">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Policys</h2>
          <pre className="rounded-2xl bg-slate-100 p-4 text-xs text-slate-600">
            {JSON.stringify(data.policyRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {}), null, 2)}
          </pre>
        </section>
        <section className="surface-card space-y-3">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Rate plans</h2>
          <ul className="space-y-2 text-sm">
            {data.planRows.map((plan) => (
              <li key={plan.id} className="list-tile">
                <span>
                  {plan.code} · {plan.name}
                </span>
                <span className="text-xs uppercase text-slate-500">{plan.currency}</span>
              </li>
            ))}
            {!data.planRows.length && <li className="text-sm text-slate-500">Inga rate plans upplagda.</li>}
          </ul>
          <Link href="/api/admin/rate-plans" className="text-xs text-indigo-600 hover:underline">
            Hantera via API
          </Link>
        </section>
        <section className="surface-card space-y-3">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Extras & Policys</h2>
          <ul className="space-y-2 text-sm">
            {data.extraRows.map((extra) => (
              <li key={extra.id} className="list-tile">
                <span>{extra.name}</span>
                <span className="text-xs text-slate-500">
                  {extra.dailyPrice ? `${extra.dailyPrice} BAM/dag` : extra.flatPrice ? `${extra.flatPrice} BAM` : ""}
                </span>
              </li>
            ))}
            {!data.extraRows.length && <li className="text-sm text-slate-500">Inga extras definierade.</li>}
          </ul>
          <Link href="/api/admin/extras" className="text-xs text-indigo-600 hover:underline">
            Hantera via API
          </Link>
        </section>
        <section className="surface-card space-y-3">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Filialer</h2>
          <ul className="space-y-2 text-sm">
            {data.branchRows.map((branch) => (
              <li key={branch.id} className="list-tile">
                <span>
                  {branch.name} · {branch.city}
                </span>
                <span className="text-xs text-slate-500">{branch.code}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

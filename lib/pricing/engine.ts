import { differenceInCalendarDays } from "date-fns";
import { db } from "../db/client";
import { prices, ratePlans, vehicleClasses } from "../db/schema";
import { and, eq, gte, isNull, lte, or } from "drizzle-orm";

export type PricingInput = {
  vehicleClassId: string;
  pickupAt: Date;
  dropoffAt: Date;
  ratePlanId?: string;
  extras?: { id: string; total: number }[];
  currency?: string;
  channel?: string;
};

export type PricingBreakdown = {
  label: string;
  amount: number;
  type: "base" | "tax" | "fee" | "extra";
};

export type PricingQuote = {
  vehicleClassId: string;
  ratePlanId: string;
  currency: string;
  days: number;
  totals: {
    base: number;
    extras: number;
    fees: number;
    taxes: number;
    total: number;
  };
  breakdown: PricingBreakdown[];
  notes: string[];
};

export async function getPricingQuote(input: PricingInput): Promise<PricingQuote> {
  const days = Math.max(1, differenceInCalendarDays(input.dropoffAt, input.pickupAt));
  const currency = input.currency ?? "BAM";
  const notes: string[] = [];

  const [vehicleClass] = await db.select().from(vehicleClasses).where(eq(vehicleClasses.id, input.vehicleClassId));
  if (!vehicleClass) {
    throw new Error("vehicle class not found");
  }

  const ratePlanQuery = db
    .select()
    .from(prices)
    .where(
      and(
        eq(prices.vehicleClassId, input.vehicleClassId),
        or(isNull(prices.startDate), lte(prices.startDate, input.pickupAt)),
        or(isNull(prices.endDate), gte(prices.endDate, input.dropoffAt))
      )
    );

  const priceRows = await ratePlanQuery;
  if (!priceRows.length) {
    throw new Error("price not configured");
  }

  const selected = priceRows.find((row) => row.ratePlanId === input.ratePlanId) ?? priceRows[0];
  const [ratePlan] = await db.select().from(ratePlans).where(eq(ratePlans.id, selected.ratePlanId));

  const base = Number(selected.baseAmount) * days;
  let extrasTotal = 0;
  const breakdown: PricingBreakdown[] = [
    { label: `Base (${days} dagar)`, amount: base, type: "base" },
  ];

  if (input.extras?.length) {
    for (const extra of input.extras) {
      extrasTotal += extra.total;
      breakdown.push({ label: `Extra ${extra.id}`, amount: extra.total, type: "extra" });
    }
  }

  if (vehicleClass.name?.toLowerCase().includes("lux")) {
    const luxuryFee = base * 0.08;
    breakdown.push({ label: "Luxury fleet fee", amount: luxuryFee, type: "fee" });
    notes.push("Luxury class surcharge (8%)");
  }

  if (days >= 7) {
    const discount = base * 0.1;
    breakdown.push({ label: "Long term discount", amount: -discount, type: "fee" });
    notes.push("10% discount for rentals >= 7 days");
  }

  const occupancyMultiplier = await getYieldMultiplier();
  if (occupancyMultiplier > 1) {
    const surge = base * (occupancyMultiplier - 1);
    breakdown.push({ label: "Occupancy surge", amount: surge, type: "fee" });
    notes.push(`Occupancy multiplier ${occupancyMultiplier}`);
  }

  const totalBase = breakdown.reduce((sum, row) => sum + (row.type === "base" ? row.amount : 0), 0);
  const feeTotal = breakdown.filter((row) => row.type === "fee").reduce((sum, row) => sum + row.amount, 0);
  const tax = Math.max(0, (totalBase + feeTotal) * 0.17);
  breakdown.push({ label: "VAT 17%", amount: tax, type: "tax" });
  const total = base + extrasTotal + feeTotal + tax;

  return {
    vehicleClassId: input.vehicleClassId,
    ratePlanId: ratePlan?.id ?? selected.ratePlanId,
    currency,
    days,
    totals: {
      base,
      extras: extrasTotal,
      fees: feeTotal,
      taxes: tax,
      total,
    },
    breakdown,
    notes,
  };
}

async function getYieldMultiplier() {
  try {
    const value = process.env.YIELD_MULTIPLIER_OVERRIDE;
    if (value) return Number(value);
    return 1;
  } catch (err) {
    console.warn("Yield multiplier fallback", err);
    return 1;
  }
}

import { describe, expect, it, vi, beforeEach } from "vitest";
import { getPricingQuote } from "@/lib/pricing/engine";
import { vehicleClasses, prices, ratePlans } from "@/lib/db/schema";

vi.mock("@/lib/db/client", () => {
  const selectMock = vi.fn();

  function makeWhere(result: any) {
    return vi.fn().mockResolvedValue(result);
  }

  selectMock.mockImplementation(() => ({
    from(table: unknown) {
      if (table === vehicleClasses) {
        return { where: makeWhere([{ id: "cls1", name: "Luxury" }]) };
      }
      if (table === prices) {
        return {
          where: makeWhere([
            {
              id: "price1",
              ratePlanId: "rate1",
              vehicleClassId: "cls1",
              baseAmount: "50",
              weekendMultiplier: "1.00",
            },
          ]),
        };
      }
      if (table === ratePlans) {
        return { where: makeWhere([{ id: "rate1", code: "STD", currency: "BAM" }]) };
      }
      return { where: makeWhere([]) };
    },
  }));

  return {
    db: {
      select: selectMock,
    },
  };
});

describe("getPricingQuote", () => {
  beforeEach(() => {
    process.env.YIELD_MULTIPLIER_OVERRIDE = "1";
  });

  it("calculates totals with luxury surcharge and tax", async () => {
    const quote = await getPricingQuote({
      vehicleClassId: "cls1",
      pickupAt: new Date("2024-07-01T08:00:00Z"),
      dropoffAt: new Date("2024-07-04T08:00:00Z"),
    });

    expect(quote.totals.base).toBe(150);
    expect(quote.notes).toContain("Luxury class surcharge (8%)");
    expect(Number(quote.totals.total.toFixed(2))).toBeGreaterThan(150);
  });
});

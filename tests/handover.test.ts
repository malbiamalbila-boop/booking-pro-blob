import { describe, expect, it } from "vitest";
import { calculateHandoverCharges } from "@/lib/policies/charges";

describe("calculateHandoverCharges", () => {
  it("computes late fee and extra km", () => {
    const result = calculateHandoverCharges({
      plannedReturn: new Date("2024-07-01T10:00:00Z"),
      actualReturn: new Date("2024-07-01T12:30:00Z"),
      includedKm: 300,
      actualKm: 450,
      lateFeePerHour: 10,
      extraKmFee: 0.2,
    });
    expect(result.minutesLate).toBe(150);
    expect(result.lateCharge).toBe(30);
    expect(result.extraKm).toBe(150);
    expect(result.kmCharge).toBeCloseTo(30);
    expect(result.total).toBeCloseTo(60);
  });
});

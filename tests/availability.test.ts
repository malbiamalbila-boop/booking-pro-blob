import { describe, expect, it } from "vitest";
import { resolveAvailability } from "@/app/api/availability/route";

describe("resolveAvailability", () => {
  it("filters busy vehicles and branch/class filters", () => {
    const vehicles = [
      { id: "v1", branchId: "b1", classCode: "ECON", displayName: "VW Golf" },
      { id: "v2", branchId: "b2", classCode: "SUV", displayName: "Hyundai Tucson" },
    ];
    const busy = new Set(["v2"]);
    const result = resolveAvailability(vehicles, busy, { pickupBranch: "b1", classCode: "ECON" });
    expect(result).toHaveLength(1);
    expect(result[0].vehicleId).toBe("v1");
  });
});

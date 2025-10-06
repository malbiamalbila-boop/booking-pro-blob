import { describe, expect, it } from "vitest";
import { getReservationBadge, isReservationActive } from "@/lib/reservations/status";

describe("reservation helpers", () => {
  it("flags inquiry as active", () => {
    expect(isReservationActive("inquiry")).toBe(true);
    expect(isReservationActive("cancelled")).toBe(false);
  });

  it("maps status to badge variants", () => {
    expect(getReservationBadge("confirmed")).toBe("primary");
    expect(getReservationBadge("cancelled")).toBe("secondary");
    expect(getReservationBadge("closed")).toBe("neutral");
  });
});

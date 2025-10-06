export type ReservationStatus = "inquiry" | "confirmed" | "waitlist" | "no_show" | "cancelled" | "closed";

export function isReservationActive(status: ReservationStatus) {
  return status === "inquiry" || status === "confirmed";
}

export function getReservationBadge(status: ReservationStatus) {
  if (status === "cancelled" || status === "no_show") return "secondary";
  if (status === "closed") return "neutral";
  return "primary";
}

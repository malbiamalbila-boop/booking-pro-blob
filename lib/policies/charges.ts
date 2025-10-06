import { differenceInMinutes } from "date-fns";

export type HandoverChargeInput = {
  plannedReturn: Date;
  actualReturn: Date;
  includedKm: number;
  actualKm: number;
  lateFeePerHour: number;
  extraKmFee: number;
};

export function calculateHandoverCharges(input: HandoverChargeInput) {
  const minutesLate = Math.max(0, differenceInMinutes(input.actualReturn, input.plannedReturn));
  const hoursLate = minutesLate > 0 ? Math.ceil(minutesLate / 60) : 0;
  const lateCharge = hoursLate * input.lateFeePerHour;
  const extraKm = Math.max(0, input.actualKm - input.includedKm);
  const kmCharge = extraKm * input.extraKmFee;
  return {
    minutesLate,
    lateCharge,
    extraKm,
    kmCharge,
    total: lateCharge + kmCharge,
  };
}

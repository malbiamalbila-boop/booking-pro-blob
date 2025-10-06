import { NextResponse } from "next/server";
import { z } from "@/lib/validation";
import { getPricingQuote } from "@/lib/pricing/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  vehicleClassId: z.string(),
  pickupAt: z.string().datetime(),
  dropoffAt: z.string().datetime(),
  ratePlanId: z.string().optional(),
  extras: z.array(z.object({ id: z.string(), total: z.number() })).optional(),
  currency: z.string().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parse = bodySchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const payload = parse.data;
  const quote = await getPricingQuote({
    vehicleClassId: payload.vehicleClassId,
    pickupAt: new Date(payload.pickupAt),
    dropoffAt: new Date(payload.dropoffAt),
    ratePlanId: payload.ratePlanId,
    extras: payload.extras,
    currency: payload.currency,
  });
  return NextResponse.json(quote, { status: 200 });
}

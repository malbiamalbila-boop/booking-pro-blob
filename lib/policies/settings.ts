import { db } from "../db/client";
import { settings } from "../db/schema";
import { eq } from "drizzle-orm";

type PolicySettings = {
  minDriverAge: number;
  fuel: string;
  gracePeriodMinutes: number;
  greenCardRequired: boolean;
};

export async function getPolicySettings(): Promise<PolicySettings> {
  const [row] = await db.select().from(settings).where(eq(settings.key, "policy"));
  return (row?.value as PolicySettings) ?? {
    minDriverAge: 23,
    fuel: "Return full",
    gracePeriodMinutes: 60,
    greenCardRequired: true,
  };
}

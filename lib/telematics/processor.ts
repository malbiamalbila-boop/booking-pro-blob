import { db } from "../db/client";
import { telemetryEvents } from "../db/schema";

export type TelematicsPayload = {
  deviceId: string;
  vehicleId: string;
  type: string;
  recordedAt: string;
  data: Record<string, unknown>;
};

export async function ingestTelematics(payload: TelematicsPayload) {
  await db.insert(telemetryEvents).values({
    vehicleId: payload.vehicleId,
    recordedAt: new Date(payload.recordedAt),
    type: (payload.type as any) ?? "movement",
    payload: payload.data,
  });
}

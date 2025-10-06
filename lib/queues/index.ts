export type QueueName =
  | "pdf_generation"
  | "notifications"
  | "telematics_rules"
  | "report_exports";

type JobPayload = Record<string, unknown>;

export async function enqueue(queue: QueueName, payload: JobPayload) {
  console.info(`Queue enqueue`, queue, payload);
}

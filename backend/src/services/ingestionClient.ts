import { InferenceLogPayload } from "../sdk/types";

const INGESTION_URL = `http://localhost:${process.env.PORT || 8000}/api/ingest`;

/**
 * Sends an inference log to the ingestion pipeline.
 * Fire-and-forget — does not block the main LLM response.
 */
export async function sendLog(payload: InferenceLogPayload): Promise<void> {
  try {
    await fetch(INGESTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Log locally but never crash the main app
    console.error("[IngestionClient] Failed to send log:", err);
  }
}

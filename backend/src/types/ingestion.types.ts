export interface IngestLogBody {
    sessionId: string;
    conversationId?: string;
    provider: string;
    model: string;
    status: "SUCCESS" | "ERROR" | "CANCELLED";
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    inputPreview?: string;
    outputPreview?: string;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
}
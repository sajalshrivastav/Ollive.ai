import OpenAI from "openai";
import { InferenceLogPayload, LLMRequestOptions, LLMResponse } from "./types";
import { redactPII } from "../services/piiRedaction";
import { sendLog } from "../services/ingestionClient";

// OpenRouter uses the OpenAI SDK format — just with a different base URL
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": "https://ollive.ai",
    "X-Title": "Ollive Chatbot",
  },
});

/**
 * Main LLM call function — wraps OpenRouter and captures all metadata
 */
export async function callLLM(options: LLMRequestOptions): Promise<LLMResponse> {
  const { provider, model, messages, conversationId, sessionId, maxTokens = 1024, temperature = 0.7 } = options;

  const startTime = Date.now();
  let status: "SUCCESS" | "ERROR" = "SUCCESS";
  let errorMessage: string | undefined;
  let content = "";
  let usage: LLMResponse["usage"] | undefined;

  // Redact PII from input messages before sending
  const redactedMessages = messages.map((m) => ({
    ...m,
    content: redactPII(m.content),
  }));

  try {
    const response = await client.chat.completions.create({
      model,
      messages: redactedMessages,
      max_tokens: maxTokens,
      temperature,
    });

    content = response.choices[0]?.message?.content || "";

    if (response.usage) {
      usage = {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      };
    }
  } catch (err: unknown) {
    status = "ERROR";
    errorMessage = err instanceof Error ? err.message : "Unknown error";
    throw err;
  } finally {
    const latencyMs = Date.now() - startTime;

    // Build the log payload
    const logPayload: InferenceLogPayload = {
      conversationId,
      sessionId,
      provider,
      model,
      status,
      latencyMs,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      totalTokens: usage?.totalTokens,
      // Only store first 200 chars as preview
      inputPreview: redactPII(messages[messages.length - 1]?.content?.slice(0, 200) || ""),
      outputPreview: redactPII(content.slice(0, 200)),
      errorMessage,
      metadata: { provider, temperature, maxTokens },
    };

    // Send log to ingestion pipeline (non-blocking — fire and forget)
    sendLog(logPayload).catch((e) => console.error("Failed to send log:", e));
  }

  return {
    content,
    provider,
    model,
    usage,
    latencyMs: Date.now() - startTime,
    sessionId,
  };
}

/**
 * Streaming version — yields chunks and logs at the end
 */
export async function* callLLMStream(options: LLMRequestOptions): AsyncGenerator<string> {
  const { provider, model, messages, conversationId, sessionId, maxTokens = 1024, temperature = 0.7 } = options;

  const startTime = Date.now();
  let fullContent = "";
  let status: "SUCCESS" | "ERROR" = "SUCCESS";
  let errorMessage: string | undefined;
  let promptTokens = 0;
  let completionTokens = 0;

  const redactedMessages = messages.map((m) => ({
    ...m,
    content: redactPII(m.content),
  }));

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: redactedMessages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        fullContent += delta;
        completionTokens++;
        yield delta;
      }

      // Capture usage from last chunk if available
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens;
        completionTokens = chunk.usage.completion_tokens;
      }
    }
  } catch (err: unknown) {
    status = "ERROR";
    errorMessage = err instanceof Error ? err.message : "Unknown error";
    throw err;
  } finally {
    const latencyMs = Date.now() - startTime;

    const logPayload: InferenceLogPayload = {
      conversationId,
      sessionId,
      provider,
      model,
      status,
      latencyMs,
      promptTokens: promptTokens || undefined,
      completionTokens: completionTokens || undefined,
      totalTokens: promptTokens + completionTokens || undefined,
      inputPreview: redactPII(messages[messages.length - 1]?.content?.slice(0, 200) || ""),
      outputPreview: redactPII(fullContent.slice(0, 200)),
      errorMessage,
      metadata: { provider, temperature, maxTokens, streaming: true },
    };

    sendLog(logPayload).catch((e) => console.error("Failed to send log:", e));
  }
}

export type Provider = "openai" | "anthropic" | "gemini" | "meta" | "mistral";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMRequestOptions {
  provider: Provider;
  model: string;
  messages: Message[];
  conversationId?: string;
  sessionId: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  provider: Provider;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  sessionId: string;
}

export interface InferenceLogPayload {
  conversationId?: string;
  sessionId: string;
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

// Available models via OpenRouter — multi-provider support
export const AVAILABLE_MODELS = [
  { provider: "openai",    model: "openai/gpt-4o",                    label: "GPT-4o" },
  { provider: "openai",    model: "openai/gpt-4o-mini",               label: "GPT-4o Mini" },
  { provider: "anthropic", model: "anthropic/claude-3.5-sonnet",      label: "Claude 3.5 Sonnet" },
  { provider: "anthropic", model: "anthropic/claude-3-haiku",         label: "Claude 3 Haiku" },
  { provider: "gemini",    model: "google/gemini-pro-1.5",            label: "Gemini Pro 1.5" },
  { provider: "meta",      model: "meta-llama/llama-3.1-8b-instruct", label: "Llama 3.1 8B" },
  { provider: "mistral",   model: "mistralai/mistral-7b-instruct",    label: "Mistral 7B" },
] as const;

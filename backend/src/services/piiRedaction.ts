const PII_ENABLED = process.env.PII_REDACTION_ENABLED === "true";

// Patterns to detect and redact common PII
const PII_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: "[EMAIL]" },
  { pattern: /\b(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, replacement: "[PHONE]" },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: "[CARD]" },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN]" },
  { pattern: /\b[A-Z]{2}\d{6}[A-Z]?\b/g, replacement: "[PASSPORT]" },
];

/**
 * Redacts PII from a string if PII_REDACTION_ENABLED is true
 */
export function redactPII(text: string): string {
  if (!PII_ENABLED || !text) return text;

  let redacted = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

const SENSITIVE_KEYS = /^(api|api[_-]?key|apikey|secret|token|password|passwd|authorization|access[-_]?token|auth|private[-_]?key|bearer|x-api-key)$/i;

const QUERY_SENSITIVE = /^(api|apikey|api[_-]?key|secret|token|access[-_]?token|authorization|private[-_]?key|client_secret)$/i;

export function redactObject(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redactObject(v, seen));
  if (seen.has(value)) return value;
  seen.add(value);

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.test(k)) {
      out[k] = "[redacted]";
    } else if (typeof v === "object" && v !== null) {
      out[k] = redactObject(v, seen);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function redactUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    for (const [k] of url.searchParams.entries()) {
      if (QUERY_SENSITIVE.test(k)) {
        url.searchParams.set(k, "[redacted]");
      }
    }
    // Strip fragment which may contain tokens.
    url.hash = "";
    return url.toString();
  } catch {
    return "[redacted-url]";
  }
}

export function redactValue(val: string): string {
  const lower = val.toLowerCase();
  if (SENSITIVE_KEYS.test(lower)) return "[redacted]";
  return val;
}

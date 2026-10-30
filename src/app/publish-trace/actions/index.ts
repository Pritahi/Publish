import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { safeFetch } from "../lib/safeFetch";
import { extractTextFromHtml, normalizeText, readFieldPath } from "../lib/fieldPath";
import { redactObject, redactUrl } from "../lib/redact";
import { MODE_IDENTITY, STATUS_MATCH, STATUS_MISMATCH, STATUS_UNKNOWN, DEFAULT_LOCALE, DEFAULT_MODEL, DEFAULT_FIELD_PATH, DEFAULT_SELECTOR } from "../lib/constants";
import type { CheckStatus } from "../lib/constants";
import type { Observation, CheckContext, CheckResult, ActionTraceEntry } from "../lib/types";

// ---------------------------------------------------------------------------
// Action 1: read the selected published Builder content (read-only)
// ---------------------------------------------------------------------------

export interface ReadBuilderContentArgs {
  model: string;
  entryRef: string;
  fieldPath: string;
  apiKey?: string;
  locale?: string;
}

export interface ReadBuilderContentResult {
  entryId: string;
  model: string;
  fieldPath: string;
  rawValue: string | null;
  normalized: string | null;
  present: boolean;
  sourceUrl: string;
  lastUpdated?: string;
  timestamp: string;
  requestOutcome: "ok" | "empty" | "error";
  error?: string;
  redacted: boolean;
}

export const readBuilderContent = defineAction({
  description: "Read one published Builder content entry field via the Builder Content API (read-only).",
  schema: z.object({
    model: z.string().min(1).describe("Builder content model name, e.g. 'page'"),
    entryRef: z.string().min(1).describe("Entry id or documented query to locate the entry"),
    fieldPath: z.string().min(1).describe("Dotted field path to the text field, e.g. 'data.headline'"),
    apiKey: z.string().optional().describe("Builder public API key (kept out of logs)"),
    locale: z.string().default(DEFAULT_LOCALE).describe("Locale/audience context"),
  }),
  readOnly: true,
  http: { method: "GET" },
  run: async ({ model, entryRef, fieldPath, apiKey, locale = DEFAULT_LOCALE }): Promise<ReadBuilderContentResult> => {
    const startedAt = Date.now();
    const sourceUrl = `https://cdn.builder.io/api/v3/content/${encodeURIComponent(model)}?apiKey=${encodeURIComponent(apiKey ?? "")}&query.id=${encodeURIComponent(entryRef)}&locale=${encodeURIComponent(locale)}`;

    const res = await safeFetch(sourceUrl, { timeoutMs: 8000 });

    if (!res.ok || res.error) {
      return {
        entryId: entryRef,
        model,
        fieldPath,
        rawValue: null,
        normalized: null,
        present: false,
        sourceUrl: redactUrl(sourceUrl),
        timestamp: new Date().toISOString(),
        requestOutcome: "error",
        error: res.error ?? `http-${res.status}`,
        redacted: true,
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(res.body);
    } catch {
      return {
        entryId: entryRef,
        model,
        fieldPath,
        rawValue: null,
        normalized: null,
        present: false,
        sourceUrl: redactUrl(sourceUrl),
        timestamp: new Date().toISOString(),
        requestOutcome: "error",
        error: "invalid-json",
        redacted: true,
      };
    }

    const entries = Array.isArray(parsed) ? parsed : [parsed];
    let entry = entries[0];
    if (entry && typeof entry === "object" && "data" in entry) {
      // Prefer an entry matching the requested id/locale if multiple returned.
    }

    const fieldRead = readFieldPath(entry, fieldPath);
    const rawValue = fieldRead.ok ? fieldRead.value : null;
    const normalized = normalizeText(rawValue);

    return {
      entryId: entryRef,
      model,
      fieldPath,
      rawValue,
      normalized,
      present: normalized !== null,
      sourceUrl: redactUrl(sourceUrl),
      lastUpdated: (entry as Record<string, unknown> | undefined)?.["lastUpdated"] as string | undefined,
      timestamp: new Date().toISOString(),
      requestOutcome: normalized === null ? "empty" : "ok",
      error: fieldRead.ok ? undefined : fieldRead.error?.kind,
      redacted: true,
    };
  },
});

// ---------------------------------------------------------------------------
// Action 2: inspect the allowed live or controlled demo page
// ---------------------------------------------------------------------------

export interface InspectPageArgs {
  url: string;
  selector: string;
}

export interface InspectPageResult {
  url: string;
  selector: string;
  rawValue: string | null;
  normalized: string | null;
  present: boolean;
  statusCode: number;
  timestamp: string;
  requestOutcome: "ok" | "empty" | "error";
  error?: string;
  redirected: boolean;
  finalUrl: string;
  redacted: boolean;
}

export const inspectPage = defineAction({
  description: "Safely fetch an authorized page and read the text of one selected element (read-only, no writes).",
  schema: z.object({
    url: z.string().url().describe("Authorized page URL to inspect"),
    selector: z.string().min(1).describe("CSS selector for the text element, e.g. 'h1' or '#banner'"),
  }),
  readOnly: true,
  http: { method: "GET" },
  run: async ({ url, selector }): Promise<InspectPageResult> => {
    const res = await safeFetch(url, { timeoutMs: 8000, maxBytes: 2_000_000 });

    if (!res.ok || res.error) {
      return {
        url: redactUrl(url),
        selector,
        rawValue: null,
        normalized: null,
        present: false,
        statusCode: res.status,
        timestamp: new Date().toISOString(),
        requestOutcome: "error",
        error: res.error ?? `http-${res.status}`,
        redirected: res.redirected,
        finalUrl: redactUrl(res.finalUrl || url),
        redacted: true,
      };
    }

    const rawValue = extractTextFromHtml(res.body, selector);
    const normalized = normalizeText(rawValue);

    return {
      url: redactUrl(url),
      selector,
      rawValue,
      normalized,
      present: normalized !== null,
      statusCode: res.status,
      timestamp: new Date().toISOString(),
      requestOutcome: normalized === null ? (res.ok ? "empty" : "error") : "ok",
      error: normalized === null && res.ok ? "selector-not-found-or-empty" : undefined,
      redirected: res.redirected,
      finalUrl: redactUrl(res.finalUrl || url),
      redacted: true,
    };
  },
});

// ---------------------------------------------------------------------------
// Action 3: compare the two observations and return an evidence-based status
// ---------------------------------------------------------------------------

export interface CompareObservationsArgs {
  builder: Observation;
  website: Observation;
}

export interface CompareObservationsResult {
  status: CheckStatus;
  uncertainty?: string;
  causeHint?: string[];
  matched: boolean;
  builderValue: string | null;
  websiteValue: string | null;
  reason: string;
}

export const compareObservations = defineAction({
  description: "Compare Builder and website observations and return MATCH / MISMATCH / UNKNOWN with evidence and uncertainty.",
  schema: z.object({
    builder: z.object({}).passthrough().describe("Builder observation object"),
    website: z.object({}).passthrough().describe("Website observation object"),
  }),
  readOnly: true,
  http: { method: "POST" },
  run: async ({ builder, website }): Promise<CompareObservationsResult> => {
    const bVal = (builder as Record<string, unknown>).normalized as string | null;
    const wVal = (website as Record<string, unknown>).normalized as string | null;
    const bOutcome = (builder as Record<string, unknown>).requestOutcome as string;
    const wOutcome = (website as Record<string, unknown>).requestOutcome as string;
    const bPresent = !!(builder as Record<string, unknown>).present;
    const wPresent = !!(website as Record<string, unknown>).present;

    // Neither side established a usable context -> UNKNOWN.
    if (!bPresent && !wPresent) {
      return {
        status: STATUS_UNKNOWN,
        builderValue: bVal ?? null,
        websiteValue: wVal ?? null,
        matched: false,
        reason: "दोनों स्रोतों से पर्याप्त टेक्स्ट नहीं मिला; तुलना के लिए संदर्भ स्थापित नहीं हुआ।",
        uncertainty: "मैं कारण निर्धारित नहीं कर सकता। फील्ड पथ, सेलेक्टर, लोकेल और प्रकाशन स्थिति जांचें।",
        causeHint: ["लोकलाइज़ेशन/टार्गेटिंग", "ए/बी प्रयोग", "क्लाइंट-साइड रेंडरिंग", "प्रकाशन स्थिति", "नेटवर्क/एक्सेस"],
      };
    }

    // One side missing while other present -> UNKNOWN (context not sufficiently established).
    if (bPresent !== wPresent) {
      const missing = bPresent ? "वेबसाइट" : "बिल्डर कॉन्टेंट";
      return {
        status: STATUS_UNKNOWN,
        builderValue: bVal ?? null,
        websiteValue: wVal ?? null,
        matched: false,
        reason: `संदर्भ अपूर्ण: ${missing} का टेक्स्ट अवलोकित नहीं हुआ।`,
        uncertainty: "असमानता पुष्टि नहीं की जा सकती क्योंकि एक स्रोत अप्राप्य है।",
        causeHint: ["सेलेक्टर नहीं मिला", "फील्ड खाली है", "पेज अनुपलब्ध", "लोकेल मेल नहीं खाता"],
      };
    }

    // Both present.
    if (bVal === null || wVal === null) {
      return {
        status: STATUS_UNKNOWN,
        builderValue: bVal ?? null,
        websiteValue: wVal ?? null,
        matched: false,
        reason: "दोनों स्रोतों में टेक्स्ट खाली है।",
        uncertainty: "तुलना के लिए कोई अर्थपूर्ण टेक्स्ट नहीं है।",
        causeHint: ["खाली फील्ड", "खाली एलिमेंट"],
      };
    }

    if (bVal === wVal) {
      return {
        status: STATUS_MATCH,
        builderValue: bVal,
        websiteValue: wVal,
        matched: true,
        reason: "बिल्डर कॉन्टेंट और लाइव पेज का टेक्स्ट सामान्यीकरण के बाद मेल खाता है।",
      };
    }

    // Confirmed mismatch only when both contexts are established.
    return {
      status: STATUS_MISMATCH,
      builderValue: bVal,
      websiteValue: wVal,
      matched: false,
      reason: "बिल्डर कॉन्टेंट और लाइव पेज का टेक्स्ट भिन्न है। यह कैश की वजह से होना ज़रूरी नहीं है।",
      uncertainty: "मैं कारण निर्धारित नहीं कर सकता। संभावनाएं: कैश, टार्गेटिंग, लोकेल, शेड्यूलिंग या क्लाइंट-साइड रेंडरिंग।",
      causeHint: ["कैश/सीडीएन स्टेल", "लोकलाइज़ेशन/टार्गेटिंग", "ए/बी प्रयोग", "क्लाइंट-साइड रेंडरिंग", "प्रकाशन नहीं हुआ"],
    };
  },
});

// ---------------------------------------------------------------------------
// Action 4: read the current check, context and evidence
// ---------------------------------------------------------------------------

export interface ReadCheckArgs {
  checkId: string;
}

export interface ReadCheckResult {
  checkId: string;
  result: CheckResult | null;
  found: boolean;
}

let checks = new Map<string, CheckResult>();

export const readCheck = defineAction({
  description: "Read a previously run check, its context and evidence trail by check id.",
  schema: z.object({
    checkId: z.string().min(1).describe("Check identifier returned by a previous run"),
  }),
  readOnly: true,
  http: { method: "GET" },
  run: async ({ checkId }): Promise<ReadCheckResult> => {
    const result = checks.get(checkId);
    if (!result) {
      return { checkId, result: null, found: false };
    }
    return { checkId, result: { ...result, trace: [...result.trace] }, found: true };
  },
});

export function registerCheck(result: CheckResult): void {
  checks.set(result.checkId, result);
}

export function getAllChecks(): CheckResult[] {
  return Array.from(checks.values());
}

export function makeTraceEntry(action: string, args: Record<string, unknown>, ok: boolean, startedAt: number, finishedAt: number, result?: unknown, error?: string): ActionTraceEntry {
  return {
    action,
    args: redactObject(args) as Record<string, unknown>,
    ok,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    durationMs: finishedAt - startedAt,
    result: ok ? redactObject(result) : undefined,
    error,
  };
}

export type { CheckContext, Observation, CheckResult };
export { STATUS_MATCH, STATUS_MISMATCH, STATUS_UNKNOWN, MODE_IDENTITY, DEFAULT_LOCALE, DEFAULT_MODEL, DEFAULT_FIELD_PATH, DEFAULT_SELECTOR };

import { MAX_FIELD_PATH_SEGMENTS, MAX_FIELD_PATH_SEGMENT_LENGTH } from "./constants";

export type FieldPathError = 
  | { kind: "empty-path" }
  | { kind: "too-deep"; max: number }
  | { kind: "segment-too-long"; max: number }
  | { kind: "invalid-segment"; segment: string }
  | { kind: "not-found"; path: string }
  | { kind: "not-string"; path: string; actualType: string };

export interface FieldReadResult {
  ok: boolean;
  value: string | null;
  error?: FieldPathError;
}

const SAFE_SEGMENT = /^[A-Za-z0-9_$.-]+$/;
const DANGEROUS_SEGMENTS = new Set(["__proto__", "constructor", "prototype"]);

export function readFieldPath(obj: unknown, path: string): FieldReadResult {
  if (!path || typeof path !== "string") {
    return { ok: false, value: null, error: { kind: "empty-path" } };
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return { ok: false, value: null, error: { kind: "empty-path" } };
  }

  const segments = trimmed.split(".");
  if (segments.length === 0 || segments.length > MAX_FIELD_PATH_SEGMENTS) {
    return { ok: false, value: null, error: { kind: "too-deep", max: MAX_FIELD_PATH_SEGMENTS } };
  }

  let current: unknown = obj;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.length === 0 || seg.length > MAX_FIELD_PATH_SEGMENT_LENGTH) {
      return { ok: false, value: null, error: { kind: "segment-too-long", max: MAX_FIELD_PATH_SEGMENT_LENGTH } };
    }
    if (!SAFE_SEGMENT.test(seg) || DANGEROUS_SEGMENTS.has(seg)) {
      return { ok: false, value: null, error: { kind: "invalid-segment", segment: seg } };
    }

    const prefix = segments.slice(0, i + 1).join(".");

    if (current === null || current === undefined) {
      return { ok: false, value: null, error: { kind: "not-found", path: prefix } };
    }

    if (Array.isArray(current)) {
      if (!/^\d+$/.test(seg)) {
        return { ok: false, value: null, error: { kind: "invalid-segment", segment: seg } };
      }
      const idx = Number(seg);
      if (idx < 0 || idx >= current.length) {
        return { ok: false, value: null, error: { kind: "not-found", path: prefix } };
      }
      current = current[idx];
      continue;
    }

    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[seg];
      continue;
    }

    return { ok: false, value: null, error: { kind: "not-found", path: prefix } };
  }

  if (current === null || current === undefined) {
    return { ok: false, value: null, error: { kind: "not-found", path: trimmed } };
  }

  if (typeof current !== "string") {
    return {
      ok: false,
      value: null,
      error: { kind: "not-string", path: trimmed, actualType: Array.isArray(current) ? "array" : typeof current },
    };
  }

  return { ok: true, value: current };
}

export function normalizeText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseAttrs(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /\b([A-Za-z][A-Za-z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrStr))) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

/**
 * Extract visible text for the first element matching a simple selector
 * (tag, #id, .class, or tag#id.class). Safe, regex-based, no DOM parser.
 * Returns null when it cannot reliably locate the element.
 */
export function extractTextFromHtml(html: string, selector: string): string | null {
  if (!html || !selector) return null;

  const match = /^(?:([A-Za-z][A-Za-z0-9]*)?)#?([A-Za-z0-9_-]*)\.?([A-Za-z0-9_-]*)?$/.exec(selector.trim());
  if (!match) return null;
  const [, wantTag, wantId, wantCls] = match;

  const openRe = /<([A-Za-z][A-Za-z0-9]*)\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(html))) {
    const tag = m[1];
    const attrs = parseAttrs(m[2]);
    if (wantTag && tag.toLowerCase() !== wantTag.toLowerCase()) continue;
    if (wantId && attrs["id"] !== wantId) continue;
    if (wantCls) {
      const classes = (attrs["class"] || "").split(/\s+/);
      if (!classes.includes(wantCls)) continue;
    }

    const tagStart = m.index;
    const gt = html.indexOf(">", m.index);
    if (gt === -1) return null;
    const closeRe = new RegExp(`</${tag}\\s*>`, "i");
    closeRe.lastIndex = gt + 1;
    const close = closeRe.exec(html);
    if (!close) return null;
    const inner = html.slice(gt + 1, close.index);
    const text = stripTags(inner).replace(/\s+/g, " ").trim();
    if (text.length) return text;
  }

  return null;
}

export function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

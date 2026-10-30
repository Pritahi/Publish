import { describe, it, expect } from "bun:test";
import { readFieldPath, normalizeText, extractTextFromHtml, stripTags } from "@/app/publish-trace/lib/fieldPath";

describe("readFieldPath", () => {
  it("reads a nested dotted path", () => {
    const r = readFieldPath({ data: { headline: "नमस्ते दुनिया" } }, "data.headline");
    expect(r.ok).toBe(true);
    expect(r.value).toBe("नमस्ते दुनिया");
  });

  it("rejects empty path", () => {
    expect(readFieldPath({}, "").ok).toBe(false);
    expect(readFieldPath({}, "   ").ok).toBe(false);
  });

  it("rejects too-deep paths", () => {
    const r = readFieldPath({ a: { b: { c: { d: { e: { f: { g: "x" } } } } } } }, "a.b.c.d.e.f.g");
    expect(r.ok).toBe(false);
    expect(r.error?.kind).toBe("too-deep");
  });

  it("rejects dangerous segment characters (no eval injection)", () => {
    const r = readFieldPath({}, "data.__proto__");
    expect(r.ok).toBe(false);
    expect(r.error?.kind).toBe("invalid-segment");
  });

  it("returns not-found for missing path", () => {
    const r = readFieldPath({ a: 1 }, "a.b.c");
    expect(r.ok).toBe(false);
    expect(r.error?.kind).toBe("not-found");
  });

  it("returns not-string for non-string leaf", () => {
    const r = readFieldPath({ count: 5 }, "count");
    expect(r.ok).toBe(false);
    expect(r.error?.kind).toBe("not-string");
  });

  it("supports numeric array indices", () => {
    const r = readFieldPath({ items: [{ text: "पहला" }, { text: "दूसरा" }] }, "items.1.text");
    expect(r.ok).toBe(true);
    expect(r.value).toBe("दूसरा");
  });
});

describe("normalizeText", () => {
  it("collapses whitespace and trims", () => {
    expect(normalizeText("  एक   दो   ")).toBe("एक दो");
  });
  it("returns null for empty/whitespace-only", () => {
    expect(normalizeText("")).toBeNull();
    expect(normalizeText("   ")).toBeNull();
    expect(normalizeText(null)).toBeNull();
  });
});

describe("extractTextFromHtml", () => {
  it("extracts h1 text", () => {
    const html = "<html><body><h1>बड़ी सेल</h1></body></html>";
    expect(extractTextFromHtml(html, "h1")).toBe("बड़ी सेल");
  });
  it("extracts by id", () => {
    const html = '<div id="banner">20% छूट</div>';
    expect(extractTextFromHtml(html, "#banner")).toBe("20% छूट");
  });
  it("extracts by class", () => {
    const html = '<span class="offer">30% छूट</span>';
    expect(extractTextFromHtml(html, ".offer")).toBe("30% छूट");
  });
  it("returns null for missing selector", () => {
    expect(extractTextFromHtml("<p>hi</p>", "#missing")).toBeNull();
  });
  it("strips tags and entities", () => {
    const out = stripTags("<b>नमस्ते</b> &amp; <i>दुनिया</i>");
    expect(out).toContain("नमस्ते");
    expect(out).toContain("&");
  });
});

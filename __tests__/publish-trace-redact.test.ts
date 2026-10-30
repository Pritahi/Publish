import { describe, it, expect } from "bun:test";
import { redactObject, redactUrl } from "@/app/publish-trace/lib/redact";

describe("redact", () => {
  it("redacts sensitive keys", () => {
    const o = redactObject({ apiKey: "secret", name: "public", nested: { token: "abc" } });
    expect((o as Record<string, unknown>).apiKey).toBe("[redacted]");
    expect((o as Record<string, unknown>).name).toBe("public");
    expect((o as Record<string, unknown>).nested.token).toBe("[redacted]");
  });
  it("redacts URL query secrets and strips fragment", () => {
    const u = redactUrl("https://cdn.builder.io/api/v3/content/page?apiKey=SECRET#frag");
    expect(u).not.toContain("SECRET");
    expect(u).not.toContain("#frag");
    expect(u).toContain("apiKey");
    expect(u).toContain("%5Bredacted%5D");
  });
});

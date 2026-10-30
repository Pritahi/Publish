import { describe, it, expect } from "bun:test";
import { runFixtureScenario, FIXTURE_SCENARIOS, simulateFixDemoPage } from "@/app/publish-trace/lib/fixtures";
import { STATUS_MATCH, STATUS_MISMATCH, STATUS_UNKNOWN } from "@/app/publish-trace/lib/constants";

describe("fixtures", () => {
  it("runs match, mismatch and inconclusive scenarios", () => {
    const match = runFixtureScenario(FIXTURE_SCENARIOS[0], "c1");
    expect(match.status).toBe(STATUS_MATCH);
    const mismatch = runFixtureScenario(FIXTURE_SCENARIOS[1], "c2");
    expect(mismatch.status).toBe(STATUS_MISMATCH);
    const inconcl = runFixtureScenario(FIXTURE_SCENARIOS[2], "c3");
    expect(inconcl.status).toBe(STATUS_UNKNOWN);
  });

  it("simulateFixDemoPage is labeled simulation", () => {
    const sim = simulateFixDemoPage();
    expect(sim.fixed).toBe(true);
    expect(sim.note).toContain("सिमुलेशन");
  });

  it("all fixture scenarios have required fields", () => {
    for (const s of FIXTURE_SCENARIOS) {
      expect(s.id).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect([STATUS_MATCH, STATUS_MISMATCH, STATUS_UNKNOWN]).toContain(s.status);
    }
  });
});

import { describe, it, expect } from "bun:test";
import { compareObservations } from "@/app/publish-trace/actions";
import { STATUS_MATCH, STATUS_MISMATCH, STATUS_UNKNOWN } from "@/app/publish-trace/lib/constants";

describe("compareObservations", () => {
  const baseObs = (normalized: string | null, present: boolean, outcome = "ok") => ({
    normalized,
    present,
    requestOutcome: outcome,
  });

  it("returns MATCH when values equal", async () => {
    const r = await compareObservations.run({ builder: baseObs("30% छूट", true), website: baseObs("30% छूट", true) });
    expect(r.status).toBe(STATUS_MATCH);
    expect(r.matched).toBe(true);
  });

  it("returns MISMATCH when values differ", async () => {
    const r = await compareObservations.run({ builder: baseObs("30% छूट", true), website: baseObs("20% छूट", true) });
    expect(r.status).toBe(STATUS_MISMATCH);
    expect(r.matched).toBe(false);
  });

  it("returns UNKNOWN when both missing", async () => {
    const r = await compareObservations.run({ builder: baseObs(null, false, "empty"), website: baseObs(null, false, "empty") });
    expect(r.status).toBe(STATUS_UNKNOWN);
    expect(r.matched).toBe(false);
  });

  it("returns UNKNOWN when one side missing", async () => {
    const r = await compareObservations.run({ builder: baseObs("30% छूट", true), website: baseObs(null, false, "empty") });
    expect(r.status).toBe(STATUS_UNKNOWN);
  });

  it("never classifies empty as match", async () => {
    const r = await compareObservations.run({ builder: baseObs(null, false, "empty"), website: baseObs(null, false, "empty") });
    expect(r.status).not.toBe(STATUS_MATCH);
  });
});

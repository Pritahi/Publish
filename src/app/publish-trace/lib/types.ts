import type { ModeIdentity, CheckStatus } from "./constants";

export interface Observation {
  source: string;
  sourceId: string;
  value: string | null;
  normalized: string | null;
  present: boolean;
  timestamp: string;
  requestOutcome: "ok" | "empty" | "error" | "not-run";
  error?: string;
  redacted?: boolean;
  context?: Record<string, unknown>;
}

export interface CheckContext {
  mode: ModeIdentity;
  model: string;
  entryRef: string;
  fieldPath: string;
  url: string;
  selector: string;
  locale: string;
  audience?: string;
}

export interface CheckResult {
  checkId: string;
  status: CheckStatus;
  builder: Observation;
  website: Observation;
  context: CheckContext;
  uncertainty?: string;
  causeHint?: string[];
  reason?: string;
  ranAt: string;
  trace: ActionTraceEntry[];
}

export interface ActionTraceEntry {
  action: string;
  args: Record<string, unknown>;
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  result?: unknown;
  error?: string;
}

export interface EvidenceSummary {
  checkId: string;
  status: CheckStatus;
  builderValue: string | null;
  websiteValue: string | null;
  builderSource: string;
  websiteSource: string;
  ranAt: string;
  uncertainty?: string;
  limitations: string[];
  redacted: boolean;
}

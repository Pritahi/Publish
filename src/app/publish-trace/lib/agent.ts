import { compareObservations, inspectPage, readBuilderContent, makeTraceEntry } from "../actions/index";
import type { CheckContext, CheckResult, Observation } from "../lib/types";
import { CheckStatus } from "../lib/constants";
import { MODE_IDENTITY, STATUS_MATCH, STATUS_MISMATCH, STATUS_UNKNOWN } from "../lib/constants";
import { v4 as uuidv4 } from "uuid";

export interface AgentInvestigationResult {
  checkId: string;
  status: CheckStatus;
  builder: Observation;
  website: Observation;
  context: CheckContext;
  uncertainty?: string;
  causeHint?: string[];
  trace: ReturnType<typeof makeTraceEntry>[];
  agentNotes: string[];
}

/**
 * Simple agent loop: calls the shared actions in sequence, reacts to results,
 * records a real evidence trail, and returns findings with uncertainty.
 * No LLM required for the core flow; the agent panel can optionally be backed
 * by a configured AI provider.
 */
export async function runAgentInvestigation(
  context: CheckContext,
  builderInput: { model: string; entryRef: string; fieldPath: string; apiKey?: string; locale?: string },
  websiteInput: { url: string; selector: string },
): Promise<AgentInvestigationResult> {
  const notes: string[] = [];
  const trace: ReturnType<typeof makeTraceEntry>[] = [];
  const checkId = uuidv4();

  const now = () => Date.now();

  // Step 1: read Builder content.
  const bStart = now();
  let builder: Observation;
  try {
    const bRes = await readBuilderContent.run({
      model: builderInput.model,
      entryRef: builderInput.entryRef,
      fieldPath: builderInput.fieldPath,
      apiKey: builderInput.apiKey,
      locale: builderInput.locale,
    });
    const bEnd = now();
    trace.push(makeTraceEntry("readBuilderContent", { model: builderInput.model, entryRef: builderInput.entryRef, fieldPath: builderInput.fieldPath, locale: builderInput.locale }, true, bStart, bEnd, bRes, undefined));
    builder = {
      source: "Builder Content API",
      sourceId: builderInput.entryRef,
      value: bRes.rawValue,
      normalized: bRes.normalized,
      present: bRes.present,
      timestamp: bRes.timestamp,
      requestOutcome: bRes.requestOutcome,
      error: bRes.error,
      context: { sourceUrl: bRes.sourceUrl, lastUpdated: bRes.lastUpdated, locale: builderInput.locale },
    };
    if (!bRes.present) {
      notes.push(`बिल्डर कॉन्टेंट उपलब्ध नहीं है (${bRes.requestOutcome})।`);
    } else {
      notes.push(`बिल्डर से टेक्स्ट पढ़ा गया: "${bRes.rawValue}"`);
    }
  } catch (err) {
    const bEnd = now();
    const errMsg = err instanceof Error ? err.message : String(err);
    trace.push(makeTraceEntry("readBuilderContent", { model: builderInput.model, entryRef: builderInput.entryRef, fieldPath: builderInput.fieldPath }, false, bStart, bEnd, undefined, errMsg));
    builder = {
      source: "Builder Content API",
      sourceId: builderInput.entryRef,
      value: null,
      normalized: null,
      present: false,
      timestamp: new Date().toISOString(),
      requestOutcome: "error",
      error: errMsg,
    };
    notes.push(`बिल्डर पढ़ने में त्रुटि: ${errMsg}`);
  }

  // Step 2: inspect website page.
  const wStart = now();
  let website: Observation;
  try {
    const wRes = await inspectPage.run({ url: websiteInput.url, selector: websiteInput.selector });
    const wEnd = now();
    trace.push(makeTraceEntry("inspectPage", { url: websiteInput.url, selector: websiteInput.selector }, true, wStart, wEnd, wRes, undefined));
    website = {
      source: "लाइव पेज (सुरक्षित फेच)",
      sourceId: `${websiteInput.selector}:${websiteInput.url}`,
      value: wRes.rawValue,
      normalized: wRes.normalized,
      present: wRes.present,
      timestamp: wRes.timestamp,
      requestOutcome: wRes.requestOutcome,
      error: wRes.error,
      context: { sourceUrl: wRes.url, statusCode: wRes.statusCode, redirected: wRes.redirected, finalUrl: wRes.finalUrl },
    };
    if (!wRes.present) {
      notes.push(`वेब पेज का टेक्स्ट नहीं मिला (${wRes.requestOutcome})।`);
    } else {
      notes.push(`वेब पेज से टेक्स्ट पढ़ा गया: "${wRes.rawValue}"`);
    }
  } catch (err) {
    const wEnd = now();
    const errMsg = err instanceof Error ? err.message : String(err);
    trace.push(makeTraceEntry("inspectPage", { url: websiteInput.url, selector: websiteInput.selector }, false, wStart, wEnd, undefined, errMsg));
    website = {
      source: "लाइव पेज (सुरक्षित फेच)",
      sourceId: `${websiteInput.selector}:${websiteInput.url}`,
      value: null,
      normalized: null,
      present: false,
      timestamp: new Date().toISOString(),
      requestOutcome: "error",
      error: errMsg,
    };
    notes.push(`वेब पेज जांचने में त्रुटि: ${errMsg}`);
  }

  // Step 3: compare observations.
  const cStart = now();
  let comp: { status: CheckStatus; matched: boolean; builderValue: string | null; websiteValue: string | null; reason: string; uncertainty?: string; causeHint?: string[] };
  try {
    comp = await compareObservations.run({ builder: builder as unknown as Record<string, unknown>, website: website as unknown as Record<string, unknown> });
    const cEnd = now();
    trace.push(makeTraceEntry("compareObservations", { builder: { normalized: builder.normalized, present: builder.present }, website: { normalized: website.normalized, present: website.present } }, true, cStart, cEnd, comp, undefined));
  } catch (err) {
    const cEnd = now();
    const errMsg = err instanceof Error ? err.message : String(err);
    trace.push(makeTraceEntry("compareObservations", { builder: { normalized: builder.normalized }, website: { normalized: website.normalized } }, false, cStart, cEnd, undefined, errMsg));
    comp = { status: STATUS_UNKNOWN, matched: false, builderValue: null, websiteValue: null, reason: "तुलना पूरी नहीं हो सकी।", uncertainty: errMsg };
  }

  const status = comp.status;
  let statusNote: string;
  if (status === STATUS_MATCH) statusNote = "निष्कर्ष: मिलान (MATCH)।";
  else if (status === STATUS_MISMATCH) statusNote = "निष्कर्ष: असमानता (MISMATCH)।";
  else statusNote = "निष्कर्ष: अनिश्चित (UNKNOWN)।";
  notes.push(statusNote);
  if (comp.uncertainty) notes.push(`अनिश्चितता: ${comp.uncertainty}`);

  const result: CheckResult = {
    checkId,
    status,
    builder,
    website,
    context,
    uncertainty: comp.uncertainty,
    causeHint: comp.causeHint,
    ranAt: new Date().toISOString(),
    trace,
  };

  return { checkId, status, builder, website, context, uncertainty: comp.uncertainty, causeHint: comp.causeHint, trace, agentNotes: notes };
}

export { readBuilderContent, inspectPage, compareObservations };

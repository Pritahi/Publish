import { CheckContext, Observation } from "./types";
import { MODE_IDENTITY, CheckStatus, STATUS_MATCH, STATUS_MISMATCH, STATUS_UNKNOWN } from "./constants";
import { normalizeText } from "./fieldPath";
import { redactUrl } from "./redact";

export const FIXTURE_SITE_URL = "https://demo.publishtrace.example/offer-page";
export const FIXTURE_MODEL = "page";
export const FIXTURE_ENTRY_ID = "entry_demo_homepage";
export const FIXTURE_FIELD_PATH = "data.headline";
export const FIXTURE_SELECTOR = "h1";
export const FIXTURE_LOCALE = "en-US";

export interface FixtureScenario {
  id: string;
  label: string;
  builderText: string | null;
  websiteText: string | null;
  status: CheckStatus;
  uncertainty?: string;
  description: string;
}

export const FIXTURE_SCENARIOS: FixtureScenario[] = [
  {
    id: "match",
    label: "पाठ मेल खाता है (Match)",
    builderText: "बड़ी सेल — सब कुछ 30% छूट",
    websiteText: "बड़ी सेल — सब कुछ 30% छूट",
    status: STATUS_MATCH,
    description: "बिल्डर में प्रकाशित ऑफर लाइव साइट पर दिख रहा टेक्स्ट से बिल्कुल मेल खाता है।",
  },
  {
    id: "mismatch",
    label: "असमानता (Mismatch)",
    builderText: "बड़ी सेल — सब कुछ 30% छूट",
    websiteText: "बड़ी सेल — सब कुछ 20% छूट",
    status: STATUS_MISMATCH,
    description: "बिल्डर में 30% छूट लिखी है, लेकिन लाइव साइट पर 20% दिख रहा है। यह पुष्टि असमानता है।",
  },
  {
    id: "inconclusive",
    label: "अनिश्चित (Inconclusive)",
    builderText: null,
    websiteText: null,
    status: STATUS_UNKNOWN,
    uncertainty: "दोनों स्रोतों से कोई टेक्स्ट नहीं मिला। सेलेक्टर या फील्ड पथ जांचें।",
    description: "बिल्डर फील्ड खाली है और वेब पेज पर सेलेक्टर नहीं मिला। कारण निर्धारित नहीं किया जा सकता।",
  },
];

export function makeFixtureObservation(source: string, sourceId: string, text: string | null, outcome: Observation["requestOutcome"] = "ok", error?: string): Observation {
  const normalized = normalizeText(text);
  return {
    source,
    sourceId,
    value: text ?? null,
    normalized,
    present: normalized !== null,
    timestamp: new Date().toISOString(),
    requestOutcome: outcome,
    error,
    context: {
      sourceUrl: redactUrl(source),
      locale: FIXTURE_LOCALE,
      simulated: true,
    },
  };
}

export function buildFixtureContext(scenarioId: string): CheckContext {
  return {
    mode: MODE_IDENTITY.FIXTURE,
    model: FIXTURE_MODEL,
    entryRef: FIXTURE_ENTRY_ID,
    fieldPath: FIXTURE_FIELD_PATH,
    url: FIXTURE_SITE_URL,
    selector: FIXTURE_SELECTOR,
    locale: FIXTURE_LOCALE,
  };
}

export function runFixtureScenario(scenario: FixtureScenario, checkId: string): {
  builder: Observation;
  website: Observation;
  status: CheckStatus;
  uncertainty?: string;
} {
  const builder = makeFixtureObservation(
    "https://cdn.builder.io/api/v3/content/page",
    FIXTURE_ENTRY_ID,
    scenario.builderText,
    scenario.builderText === null ? "empty" : "ok",
    scenario.builderText === null ? "no content returned for field path" : undefined,
  );
  const website = makeFixtureObservation(
    FIXTURE_SITE_URL,
    `${FIXTURE_SELECTOR}:${FIXTURE_SITE_URL}`,
    scenario.websiteText,
    scenario.websiteText === null ? "empty" : "ok",
    scenario.websiteText === null ? "selector not found on page" : undefined,
  );
  return { builder, website, status: scenario.status, uncertainty: scenario.uncertainty };
}

export function simulateFixDemoPage(): { fixed: boolean; message: string; note: string } {
  return {
    fixed: true,
    message: "डेमो पेज का टेक्स्ट अपडेट कर दिया गया है ताकि वह बिल्डर से मेल खाए।",
    note: "यह केवल नियंत्रित डेमो का सिमुलेशन है। असली CDN या कैश साफ नहीं किया गया।",
  };
}

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Search,
  FileText,
  Copy,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
  Layout,
  Bot,
  Terminal,
} from "lucide-react";
import {
  STATUS_MATCH,
  STATUS_MISMATCH,
  STATUS_UNKNOWN,
  MODE_IDENTITY,
  DEFAULT_LOCALE,
  DEFAULT_MODEL,
  DEFAULT_FIELD_PATH,
  DEFAULT_SELECTOR,
} from "@/app/publish-trace/lib/constants";
import type { CheckContext, CheckResult, Observation } from "@/app/publish-trace/lib/types";
import { runFixtureScenario, FIXTURE_SCENARIOS, FIXTURE_SITE_URL, FIXTURE_MODEL, FIXTURE_ENTRY_ID, FIXTURE_FIELD_PATH, FIXTURE_SELECTOR, FIXTURE_LOCALE, simulateFixDemoPage } from "@/app/publish-trace/lib/fixtures";
import { redactUrl } from "@/app/publish-trace/lib/redact";

const BASE = typeof window !== "undefined" ? "" : "";

function statusBadge(status: string) {
  const confMap = {
    [STATUS_MATCH]: { variant: "default" as const, label: "मिलान (Match)", icon: <CheckCircle2 className="h-4 w-4" /> },
    [STATUS_MISMATCH]: { variant: "destructive" as const, label: "असमानता (Mismatch)", icon: <XCircle className="h-4 w-4" /> },
    [STATUS_UNKNOWN]: { variant: "secondary" as const, label: "अनिश्चित (Unknown)", icon: <AlertTriangle className="h-4 w-4" /> },
  };
  const conf = confMap[status] ?? confMap[STATUS_UNKNOWN];
  return (
    <Badge variant={conf.variant} className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
      {conf.icon} {conf.label}
    </Badge>
  );
}

function fmtTime(ts: string | undefined): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("hi-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function obsPanel(title: string, obs: Observation | null, sourceLabel: string) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <div className="text-xs text-muted-foreground">{sourceLabel}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        {obs ? (
          <>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">स्थिति: {obs.requestOutcome}</span>
              {obs.redacted && <span className="text-xs text-slate-500">की-मान छिपाए गए हैं</span>}
            </div>
            <div className="text-sm font-mono bg-muted/50 p-3 rounded border border-slate-200/50 break-words">
              {obs.present && obs.value ? obs.value : "<कोई टेक्स्ट नहीं>"}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div><div className="font-sans text-[10px] uppercase">समय</div><div>{fmtTime(obs.timestamp)}</div></div>
              <div><div className="font-sans text-[10px] uppercase">स्रोत</div><div className="truncate">{String(obs.context?.sourceUrl ?? obs.sourceId)}</div></div>
            </div>
            {obs.error && <div className="text-[11px] text-destructive">{obs.error}</div>}
          </>
        ) : (
          <div className="text-xs text-muted-foreground italic">अभी जांच नहीं हुई।</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PublishTracePage() {
  const [mode, setMode] = useState<string>("fixture");
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [entryRef, setEntryRef] = useState<string>(FIXTURE_ENTRY_ID);
  const [fieldPath, setFieldPath] = useState<string>(FIXTURE_FIELD_PATH);
  const [url, setUrl] = useState<string>(FIXTURE_SITE_URL);
  const [selector, setSelector] = useState<string>(FIXTURE_SELECTOR);
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE);
  const [apiKey, setApiKey] = useState<string>("");
  const [audience, setAudience] = useState<string>("");
  const [scenarioId, setScenarioId] = useState<string>("match");

  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [agentLog, setAgentLog] = useState<string[]>([]);
  const [agentThinking, setAgentThinking] = useState<boolean>(false);
  const [fixApplied, setFixApplied] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const traceRef = useRef<CheckResult["trace"]>([]);

  const isFixture = mode === "fixture";

  const context: CheckContext = {
    mode: isFixture ? MODE_IDENTITY.FIXTURE : MODE_IDENTITY.REAL,
    model,
    entryRef,
    fieldPath,
    url,
    selector,
    locale,
    audience: audience || undefined,
  };

  const onModeChange = (value: string) => setMode(value);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAgentLog([]);
    traceRef.current = [];
    setFixApplied(false);

    try {
      if (isFixture) {
        const scenario = FIXTURE_SCENARIOS.find((s) => s.id === scenarioId) ?? FIXTURE_SCENARIOS[0];
        const { builder, website, status, uncertainty } = runFixtureScenario(scenario, "check_" + Math.random().toString(36).slice(2, 9));

        const res = await fetch(`${BASE}/api/publish-trace/actions?action=compareObservations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ builder, website }),
        });
        const comp = await res.json();

        const full: CheckResult = {
          checkId: "check_" + Math.random().toString(36).slice(2, 9),
          status: comp.status,
          builder,
          website,
          context,
          uncertainty: comp.uncertainty ?? uncertainty,
          causeHint: comp.causeHint,
          reason: comp.reason,
          ranAt: new Date().toISOString(),
          trace: [
            { action: "readBuilderContent", args: { model, entryRef, fieldPath, locale }, ok: builder.present, startedAt: builder.timestamp, finishedAt: builder.timestamp, durationMs: 0, result: { rawValue: builder.value, normalized: builder.normalized }, error: builder.error },
            { action: "inspectPage", args: { url, selector }, ok: website.present, startedAt: website.timestamp, finishedAt: website.timestamp, durationMs: 0, result: { rawValue: website.value, normalized: website.normalized }, error: website.error },
            { action: "compareObservations", args: {}, ok: true, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), durationMs: 0, result: comp },
          ],
        };

        setResult(full);
        traceRef.current = full.trace;
        setAgentLog([
          `फ़िक्स्चर डेमो चलाया गया: "${scenario.label}"`,
          `बिल्डर: "${builder.value ?? "कोई टेक्स्ट नहीं"}"`,
          `वेबसाइट: "${website.value ?? "कोई टेक्स्ट नहीं"}"`,
          comp.reason ?? `निष्कर्ष: ${comp.status}`,
          comp.uncertainty ? `अनिश्चितता: ${comp.uncertainty}` : "",
        ].filter(Boolean));
      } else {
        // Real read-only mode: call shared HTTP actions then agent comparison.
        setAgentLog(["रीड-ओनली जांच शुरू की जा रही है..."]);
        const agentRes = await fetch(`${BASE}/api/publish-trace/actions?action=runAgent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context,
            builderInput: { model, entryRef, fieldPath, apiKey: apiKey || undefined, locale },
            websiteInput: { url, selector },
          }),
        });
        if (!agentRes.ok) throw new Error("एजेंट जांच विफल");
        const data = await agentRes.json();
        setResult(data);
        traceRef.current = data.trace;
        setAgentLog(data.agentNotes ?? ["जांच पूरी हुई।"]);
        setFixApplied(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "जांच चलाने में त्रुटि हुई।");
    } finally {
      setLoading(false);
      setAgentThinking(false);
    }
  }, [isFixture, model, entryRef, fieldPath, locale, url, selector, apiKey, audience, scenarioId, context, BASE]);

  const handleFixDemo = useCallback(() => {
    const sim = simulateFixDemoPage();
    setFixApplied(true);
    setAgentLog([...agentLog, sim.message, sim.note]);
  }, [agentLog]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    const summary: Record<string, unknown> = {
      checkId: result.checkId,
      status: result.status,
      builderValue: result.builder.value,
      websiteValue: result.website.value,
      builderSource: result.builder.source,
      websiteSource: result.website.source,
      ranAt: result.ranAt,
      uncertainty: result.uncertainty,
      limitations: ["केवल एक फ़ील्ड और एक पेज एलिमेंट की तुलना", "कैश/टार्गेटिंग/लोकेल कारण पुष्ट नहीं", "केवल पठनीय जांच"],
      redacted: true,
    };
    navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [result]);

  const statusColor = (s: string) => (s === STATUS_MATCH ? "text-emerald-700 bg-emerald-50" : s === STATUS_MISMATCH ? "text-rose-700 bg-rose-50" : "text-slate-700 bg-slate-50");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-[280px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" /> PublishTrace
              </CardTitle>
              <CardDescription>
                बिल्डर कॉन्टेंट और लाइव वेब पेज की तुलना करें। रीड-ओलنی जांच।
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="mode" className="text-xs font-semibold">मोड</Label>
                <Select value={mode} onValueChange={onModeChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="मोड चुनें" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixture">फ़िक्स्चर डेमो (क्रेडेंशियल्स बिना)</SelectItem>
                    <SelectItem value="real">असली रीड-ओलनी जांच</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isFixture && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">डेमो परिदृश्य</Label>
                  <Select value={scenarioId} onValueChange={setScenarioId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="परिदृश्य" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIXTURE_SCENARIOS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">{FIXTURE_SCENARIOS.find((s) => s.id === scenarioId)?.description}</p>
                </div>
              )}

              {!isFixture && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">बिल्डर मॉडल</Label>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="page" />
                  <Label className="text-xs font-semibold mt-2">एंट्री रेफरेंस / आईडी</Label>
                  <Input value={entryRef} onChange={(e) => setEntryRef(e.target.value)} placeholder="एंट्री आईडी" />
                  <Label className="text-xs font-semibold mt-2">फील्ड पथ</Label>
                  <Input value={fieldPath} onChange={(e) => setFieldPath(e.target.value)} placeholder="data.headline" />
                  <Label className="text-xs font-semibold mt-2">लोकल</Label>
                  <Input value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="en-US" />
                  <Label className="text-xs font-semibold mt-2">जनता एपीआई कुंजी (निजी)</Label>
                  <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="केवल आपके एन्व में, लॉग में नहीं" />
                  <Label className="text-xs font-semibold mt-2">लोकल/ऑडियंस संदर्भ</Label>
                  <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="वैकल्पिक" />
                  <p className="text-xs text-slate-500">असली मोड में केवल पठनीय सार्वजनिक एपीआई कुंजी का उपयोग करें। लिखने की अनुमति नहीं दी जाएगी।</p>
                </div>
              )}

              {!isFixture && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">वेबसाइट यूआरएल</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/offers" />
                  <Label className="text-xs font-semibold mt-2">सेलेक्टर</Label>
                  <Input value={selector} onChange={(e) => setSelector(e.target.value)} placeholder="h1" />
                  <p className="text-xs text-slate-500">केवल अधिकृत साइट जांचें। निजी/लूपबैक पता अस्वीकृत कर दिए जाएंगे।</p>
                </div>
              )}

              <Button onClick={runCheck} disabled={loading} className="w-full" size="lg">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "जांच चलाएं (Run check)"}
              </Button>
              {error && <div className="p-3 rounded bg-rose-50 border border-rose-200 text-[11px] text-rose-800">{error}</div>}
            </CardContent>
          </Card>

          {isFixture && fixApplied && (
            <Card className="mt-4">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-[11px]">
                  <Shield className="h-3 w-3 text-emerald-600" />
                  <span className="font-semibold">डेमो ठीक किया गया (सिमुलेशन)</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">यह केवल नियंत्रित डेमो का सिमुलेशन है। असली सीडीएन/कैश साफ नहीं किया गया।</p>
                <Button onClick={runCheck} size="sm" className="mt-2">फिर से जांच चलाएं</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex-1 min-w-[320px]">
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="results" className="flex-1">परिणाम</TabsTrigger>
              <TabsTrigger value="agent" className="flex-1">एजेंट पैनल</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {obsPanel("बिल्डर कॉन्टेंट", result?.builder ?? null, "बिल्डर कॉन्टेंट एपीआई")}
                {obsPanel("लाइव वेब पेज", result?.website ?? null, "अधिकृत पेज")}
              </div>

              {result && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>तुलना परिणाम</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className={`p-3 rounded border ${statusColor(result.status)}`}>
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-sm">{statusBadge(result.status)}</div>
                          <div className="text-xs text-slate-500">चलाया गया: {fmtTime(result.ranAt)}</div>
                        </div>
                        <p className="text-xs mt-2">{result.builder.normalized ?? "कोई टेक्स्ट नहीं"} ↔ {result.website.normalized ?? "कोई टेक्स्ट नहीं"}</p>
                        {result.reason && <p className="text-xs mt-1 text-slate-600">{result.reason}</p>}
                        {result.uncertainty && (
                          <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                            ⚠️ {result.uncertainty}
                          </div>
                        )}
                        {result.causeHint && result.causeHint.length && (
                          <div className="mt-2 text-[11px] text-slate-500">
                            संभावित कारण (पुष्टि नहीं): {result.causeHint.join(" · ")}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={runCheck} size="sm" variant="outline">फिर से चलाएं</Button>
                        <Button onClick={handleCopy} size="sm" disabled={copied}>
                          {copied ? "कॉपी किया गया" : "सबूत कॉपी करें"} <Copy className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>सीमाएं और ध्यान रखने योग्य बातें</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-600 space-y-1">
                      <ul className="list-disc list-inside space-y-1">
                        <li>केवल एक बिल्डर फील्ड और एक पेज सेलेक्टर की तुलना की गई है।</li>
                        <li>असमानता का मतलब कैश होना साबित नहीं करता। कारण अज्ञात रह सकता है।</li>
                        <li>लोकलाइज़ेशन, टार्गेटिंग, ए/बी प्रयोग और क्लाइंट-साइड रेंडरिंग समर्थित नहीं हैं।</li>
                        <li>कोई लिखने की कार्रवाई, प्रकाशन या कैश सफाई नहीं की जाती।</li>
                        <li>कुंजी और टोकन लॉग और निर्यात से छिपाए जाते हैं।</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="agent" className="mt-4">
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <CardTitle className="text-sm">एजेंट जांच लॉग</CardTitle>
                  <span className="ml-auto text-xs">{agentThinking ? "सोच रहा है..." : "तैयार"}</span>
                </CardHeader>
                <CardContent className="h-64 overflow-y-auto font-mono text-xs space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                  {agentLog.length ? agentLog.map((m, i) => <div key={i}>• {m}</div>) : <div className="text-slate-400 italic">अभी कोई कार्रवाई दर्ज नहीं हुई।</div>}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button onClick={runCheck} disabled={loading || agentThinking} size="sm">
                    {agentThinking ? <Loader2 className="h-3 w-3 animate-spin" /> : "एजेंट से अगला कदम पूछें"}
                  </Button>
                  <Button onClick={runCheck} size="sm" variant="outline">सब कुछ रीसेट करें</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="mt-8 border-t pt-4 text-xs text-slate-500">
        PublishTrace — बिल्डर कॉन्टेंट जांच सहायक। फ़िक्स्चर डेमो काल्पनिक डेटा दिखाता है। असली मोड में अधिकृत साइट और पठनीय बिल्डर एपीआई कुंजी की ज़रूरत होती है।
      </div>
    </div>
  );
}

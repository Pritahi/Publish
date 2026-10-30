import { NextRequest, NextResponse } from "next/server";
import { readBuilderContent, inspectPage, compareObservations, readCheck, registerCheck, getAllChecks } from "@/app/publish-trace/actions";
import { runAgentInvestigation } from "@/app/publish-trace/lib/agent";
import type { CheckContext } from "@/app/publish-trace/lib/types";

export const runtime = "nodejs";

async function getBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "readBuilderContent") {
    const model = searchParams.get("model") ?? "";
    const entryRef = searchParams.get("entryRef") ?? "";
    const fieldPath = searchParams.get("fieldPath") ?? "";
    const apiKey = searchParams.get("apiKey") ?? undefined;
    const locale = searchParams.get("locale") ?? undefined;
    const result = await readBuilderContent.run({ model, entryRef, fieldPath, apiKey, locale });
    return NextResponse.json(result);
  }

  if (action === "inspectPage") {
    const url = searchParams.get("url") ?? "";
    const selector = searchParams.get("selector") ?? "";
    const result = await inspectPage.run({ url, selector });
    return NextResponse.json(result);
  }

  if (action === "readCheck") {
    const checkId = searchParams.get("checkId") ?? "";
    const result = await readCheck.run({ checkId });
    return NextResponse.json(result);
  }

  if (action === "listChecks") {
    return NextResponse.json({ checks: getAllChecks() });
  }

  return NextResponse.json({ error: "unknown-action" }, { status: 400 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const body = (await getBody(req)) as Record<string, unknown> | null;

  if (action === "compareObservations") {
    const builder = body?.builder as Record<string, unknown> | undefined;
    const website = body?.website as Record<string, unknown> | undefined;
    if (!builder || !website) {
      return NextResponse.json({ error: "builder and website required" }, { status: 400 });
    }
    const result = await compareObservations.run({ builder, website });
    return NextResponse.json(result);
  }

  if (action === "runAgent") {
    const context = body?.context as CheckContext | undefined;
    const builderInput = body?.builderInput as Record<string, unknown> | undefined;
    const websiteInput = body?.websiteInput as Record<string, unknown> | undefined;
    if (!context || !builderInput || !websiteInput) {
      return NextResponse.json({ error: "context, builderInput and websiteInput required" }, { status: 400 });
    }
    const result = await runAgentInvestigation(context, builderInput as any, websiteInput as any);
    registerCheck(result as any);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "unknown-action" }, { status: 400 });
}

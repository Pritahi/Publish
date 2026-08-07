"use client";

/**
 * Microsoft Clarity – global analytics + session recording.
 *
 * - Loaded once on the client after hydration (useEffect), so SSR is not affected
 *   and there are no hydration mismatches.
 * - Uses the official `@microsoft/clarity` SDK.
 * - Project ID is non-secret (it ships to the browser anyway), so it is safe to
 *   hard-code. We still read `NEXT_PUBLIC_CLARITY_ID` if present so the same
 *   codebase can target different Clarity projects per environment.
 * - Only runs in production by default to keep dev sessions out of recordings.
 *   Override with NEXT_PUBLIC_CLARITY_ENABLED="true" to enable in dev/preview.
 */

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

const CLARITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_CLARITY_ID || "xyjqzlqjap";

const ENABLED =
  process.env.NEXT_PUBLIC_CLARITY_ENABLED === "true" ||
  process.env.NODE_ENV === "production";

export function ClarityAnalytics() {
  useEffect(() => {
    if (!ENABLED) return;
    if (!CLARITY_PROJECT_ID) return;

    try {
      Clarity.init(CLARITY_PROJECT_ID);
    } catch (err) {
      // Silently fail – analytics must never break the app.
      console.warn("[clarity] init failed", err);
    }
  }, []);

  return null;
}

export default ClarityAnalytics;

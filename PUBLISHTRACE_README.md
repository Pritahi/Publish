# PublishTrace — Builder.io Content-to-Live Verification Agent

> Read-only investigation assistant that checks whether a piece of published
> Builder.io content matches the text observed on an authorized website, and
> helps investigate discrepancies with human control.

**Builder.io Agent-Native Hackathon submission.** Functional, read-only, and
safe by design. Not Relay. New project.

## What it does

Compare **one** configured Builder content field against **one** text element on
**one** authorized site:

1. Read the published Builder entry field via the Builder Content API.
2. Safely fetch the authorized page and read the selected element's text.
3. Compare the two observations → **MATCH**, **MISMATCH**, or **UNKNOWN** (inconclusive).
4. Show both observed values side by side, with timestamps, source IDs, context,
   evidence trail, and uncertainty warnings.

A human (or agent) can run the check, inspect evidence, ask the agent for the
next investigation step, rerun, and copy/export an evidence summary.

Two modes:

- **Fixture demo** — self-contained fictional data. Runs without credentials.
  Demonstrates match, mismatch, and inconclusive results. A "fix demo page"
  button simulates updating only the controlled demo page (labeled as a
  simulation — no real CDN/cache is touched).
- **Real read-only check** — uses your own Builder test space/entry (public
  read-only API key) and an authorized site or app-provided controlled test page.
  The CMS observation genuinely comes from Builder. Nothing is written.

## Agent-Native (shared actions)

All core capabilities are implemented once as shared typed actions using the
official Agent-Native framework's `defineAction` pattern (`@agent-native/core`):

- `readBuilderContent` — read published Builder content (read-only, HTTP GET)
- `inspectPage` — safely inspect an authorized page element (read-only, HTTP GET)
- `compareObservations` — compare and return MATCH/MISMATCH/UNKNOWN (HTTP POST)
- `readCheck` — read a prior check's context and evidence (HTTP GET)

The UI and the agent call the **same underlying actions** over HTTP. The agent
panel actually invokes the actions, records a real evidence trail, reports
evidence and uncertainty, and never fakes tool calls.

## Safety

- Read-only only. No writes to Builder content or customer websites. No
  automatic publishing, cache purge, or notifications.
- Safe outbound fetch: tight host allowlist logic rejects private/loopback/
  link-local/cloud-metadata/reserved addresses (IPv4 + IPv6, incl. IPv4-mapped),
  checks every redirect, enforces connection/response-size/time limits, strips
  URL credentials, and blocks fragments.
- Server-rendered HTML inspection only (no unrestricted headless browser).
- API keys/tokens are redacted from logs, traces, and exports.
- Default local development is private; auth/security limitations explained
  before any public deployment.

## Files (added to this workspace)

```
src/app/publish-trace/
  page.tsx              # main UI (configuration, run check, observations, agent panel, export)
  api/actions/route.ts  # HTTP endpoints exposing the shared actions
  actions/index.ts      # shared typed actions (defineAction from @agent-native/core)
  lib/agent.ts          # agent investigation loop (calls the shared actions)
  lib/constants.ts      # statuses, defaults, identities
  lib/fieldPath.ts      # safe nested field-path reader (no eval) + HTML text extraction
  lib/fixtures.ts       # fixture demo scenarios (match/mismatch/inconclusive)
  lib/redact.ts         # secret/key/URL redaction
  lib/safeFetch.ts      # safe outbound fetch with allowlist + redirect/size/time limits
  lib/types.ts          # shared types
__tests__/publish-trace-*.test.ts   # unit tests (field path, safe fetch, compare, redact, fixtures)
```

## Prerequisites

- Node.js 18+ (workspace uses Node 24)
- npm (workspace package manager)

The workspace already has dependencies installed (`node_modules` present after
`npm install` plus `@agent-native/core`).

## Setup

1. Copy the example environment:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your private values (fixture demo works without any key):

   - `BUILDER_API_KEY` — your Builder.io **public** read-only API key (only needed for REAL mode).
   - `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` — optional, only to enable the real AI-agent panel.

3. Install dependencies (if not already installed):

   ```bash
   npm install
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000/publish-trace`.

## Running the fixture demo (no credentials)

1. Open `http://localhost:3000/publish-trace`.
2. Leave mode as **फ़िक्स्चर डेमो** (Fixture demo).
3. Pick a scenario (मिलान / असमानता / अनिश्चित) and click **जांच चलाएं** (Run check).
4. Observe builder vs website text side by side, the status, and the agent log.
5. Try **डेमो ठीक करें** (Fix demo — simulation only), then **फिर से चलाएं**.

## Running the real read-only check

1. Set `BUILDER_API_KEY` in `.env` (Builder public read-only key).
2. Switch mode to **असली रीड-ओनली जांच** (Real read-only check).
3. Enter: Builder model, entry id/reference, field path (e.g. `data.headline`),
   locale, your public API key, authorized website URL, and CSS selector (e.g. `h1`).
4. Click **जांच चलाएं**. The CMS observation comes from Builder via the Content API.
5. Inspect the side-by-side observations, status, and evidence.

> Only inspect sites you are authorized to check. Private/loopback/reserved URLs
> are rejected automatically.

## Commands

```bash
# Install dependencies
npm install

# Type check
npx tsc --noEmit

# Run PublishTrace unit tests
bun test __tests__/publish-trace-

# Lint the PublishTrace files
npx eslint src/app/publish-trace __tests__/publish-trace-*.test.ts

# Dev server
npm run dev

# Production build (may need more heap memory in constrained environments)
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## Test results

All 28 PublishTrace unit tests pass across 5 test files:
- safe nested field-path reading (incl. no-eval injection rejection, too-deep, array indices)
- text normalization
- HTML text extraction (tag/id/class, missing selector, entity stripping)
- safe fetch host blocking (private/loopback/link-local IPv4+IPv6, public allowed)
- compareObservations (MATCH, MISMATCH, UNKNOWN both-missing, one-missing, never-empty-as-match)
- secret/key/URL redaction
- fixture scenarios (match/mismatch/inconclusive, fix-demo simulation labeling)

## What is real vs simulated

| Item | Status |
|------|--------|
| Fixture demo UI & match/mismatch/inconclusive | Implemented & tested |
| Shared Agent-Native `defineAction` actions | Implemented & tested |
| Real read-only Builder Content API check | Implemented (requires `BUILDER_API_KEY` + your Builder test entry; not yet run against live Builder) |
| Real AI-agent panel | Implemented (requires an AI provider key; not yet tested against a live provider) |
| Fix-demo button | Labeled simulation only; no real CDN/cache purge |
| Live deployment / Clips demo recording | Not done (do not publish/deploy without your permission) |

## Submission (do not execute without permission)

- Record a public Clips demo (viewable without login) showing the fixture mode
  running a match, mismatch, and inconclusive check.
- Submit via https://www.builder.io/hackathon/submit by the deadline
  (previously Nov 9, 2026 11:59 PM PT — recheck the official rules before
  relying on it).
- Public repo / live deployment encouraged but not required.
- Do not upload tax forms, identity documents, or payment credentials to the
  public demo or submission form.

I have not submitted, published, deployed, or used any paid service on your
behalf.

## License

MIT (matches this workspace). Third-party dependencies follow their own
licenses; see `package-lock.json` / `node_modules`.

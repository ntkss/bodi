# Gemini Prompt — บ่อดี (BODI) Water Risk Alerts

You are a pragmatic senior full-stack engineer working on the existing **บ่อดี (BODI)** app.

## Goal

Add a lean, location-aware environmental water-risk feature for natural/semi-natural aquaculture ponds in Samut Songkhram, Thailand. Use verified local rainfall, water-level, tide-prediction, and available water-quality data to help farmers decide when to inspect the canal and pond. Do not claim external data can prove that pond water is spoiled.

## Read first

1. Inspect the existing repository and app behavior.
2. Read `SKILL.md` and `implementation_plan.md`.
3. Preserve the existing React/Vite/Tailwind, Vercel, Prisma/PostgreSQL, and TanStack Query setup where present.
4. Do not rewrite the app or introduce a new framework.

## Strict anti-overengineering constraints

- One codebase, one app, one existing database.
- No microservices, Redis, queues, data warehouse, ML, AI, or IoT in this milestone.
- Do not add Cron until source fetching is proven and a refresh schedule is justified.
- Do not add dependencies without a current requirement.
- Do not build a generic integration framework for hypothetical providers.
- Reuse existing Alert models and API patterns.
- Do not change unrelated features.
- If a provider cannot be verified, document it as blocked and provide manual fallback rather than faking success.

## Candidate sources to verify

1. ThaiWater / Hydro-Informatics Institute: https://standard.thaiwater.net/docs/
   - Investigate documented rainfall, runoff/water-level, and water-quality data.
   - Verify actual endpoint, authentication, parameters, station IDs/metadata, units, timestamps, rate limits, terms, and server-side access.
2. Royal Thai Navy Hydrographic Department tide tables: https://hydro.navy.mi.th/waterlaveltable
   - Verify the current official table and exact station label for the Mae Klong estuary / Pak Nam Mae Klong.
   - Determine whether a documented API exists or only an official downloadable file is available.
   - Do not invent an API or scrape fragile pages.
3. Open Government Data Thailand candidate dataset: https://data.go.th/en/dataset/disaster_2569_145
   - Verify publisher, format, license, coverage and update cadence. Do not assume annual data is continuously updated.
4. Pollution Control Department IWIS: https://iwis.pcd.go.th/
   - Identify relevant water-quality stations and verify whether a documented API/download exists. Do not assume the portal itself is an API.
5. Optional Open-Meteo supplement: https://open-meteo.com/en/docs
   - Check current free-tier and commercial-use terms before use. Do not depend on an unsuitable plan for critical farm alerts.

## Station relevance

Target province is Samut Songkhram; the farm uses a canal connected to an estuary/sea and water exchange decisions use multiple signals. A tide table for Pak Nam Mae Klong may be a useful reference, but it is not the actual water level at every farm canal.

Do not guess farm coordinates, station IDs, or station suitability. Search verified official metadata and document why each candidate might or might not represent the farm's connected water system. If exact farm coordinates are missing, implement configuration fields and report that station matching is incomplete.

## Implement now: Milestone 1 only

- Inspect current schema, routes, API utilities and alert logic.
- Add only missing farm water-source/location and reference-station fields/models.
- Create `docs/water-data-sources.md` documenting source URLs, actual access methods, terms/license status, candidate station IDs/names/coordinates (only if verified), parameters, units, observed timestamps, update frequency and limitations.
- Test one real source end-to-end if access is available.
- If no source is accessible, document exact blockers and manual/import fallback.
- Update `implementation_plan.md` with completed status and unresolved issues.

## Do not implement yet: Milestone 2

Later, add a compact dashboard section showing latest rainfall, relevant observed water level, predicted tide window, available relevant source-water-quality readings, timestamps and freshness. Avoid chart-heavy UI.

## Do not implement yet: Milestone 3

Later, implement explainable rules:

- rainfall event -> suggest checking pond/canal levels and water quality;
- predicted high tide -> remind farmer to check actual canal level;
- relevant source-water-quality anomaly -> advise checking before water exchange;
- actual pond log anomaly (e.g. low DO or unusual mortality) -> pond-level alert.

Thresholds must be sourced/configurable. Do not invent universal values. Tide predictions must never be treated as observed water levels. Never automate gate opening/closing.

## Implementation rules

- External provider calls must be server-side.
- Normalize and validate provider responses before storage/display.
- Keep `observedAt` separate from `fetchedAt`.
- Missing, stale, malformed, or irrelevant-station data means unknown, not safe.
- Show source, timestamp and freshness.
- Use TanStack Query for the app's own API if already installed.
- Keep manual pond logs working when external services fail.
- Reuse existing Alert structures and add deduplication only if missing.
- Secure protected routes using existing project conventions.
- Never expose provider secrets in browser bundles.
- Never claim an integration is live unless a real request/import succeeded.

## Testing and completion

Run existing lint, typecheck, tests, Prisma validation and production build commands as available. Report only commands actually run and real results.

Deliver code for Milestone 1 only, updated `implementation_plan.md`, `docs/water-data-sources.md`, tests for normalization/freshness/validation where implemented, and a final report listing changed files, source verification status, test/build results, blockers, and next step.

Start by inspecting the repository. Implement Milestone 1 only, then stop and report. Do not silently continue into Milestones 2 or 3.

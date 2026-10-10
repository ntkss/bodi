# บ่อดี (BODI) — Water Risk Alerts Implementation Plan

**Milestone:** Location-aware environmental water risk alerts  
**Target area:** Samut Songkhram, Thailand  
**Approach:** Lean MVP — verify data first, build explainable rules second.

## 1. Goal

Extend the existing บ่อดี app so a farmer can understand environmental conditions that may affect natural/semi-natural shrimp, crab, or shellfish ponds. Use relevant local rainfall, river/canal water-level, tide-prediction, and available water-quality observations to raise cautious, explainable alerts.

Distinguish clearly:

- **Environmental risk:** conditions outside the pond suggest that extra checks may be useful.
- **Measured pond issue:** a reading or observation recorded at the pond indicates a potential problem.
- **Unknown / stale data:** evidence is insufficient or too old to support an assessment.

External data must never be presented as proof that pond water is spoiled. Tide predictions are not actual water levels at an individual pond.

## 2. Lean scope constraints

- Extend the existing app; do not rewrite it or introduce a second architecture.
- Keep one codebase and the current database.
- No microservices, Redis, queues, data warehouse, ML, AI, or IoT in this milestone.
- No automatic gate/valve control.
- Do not add Cron until source integration works and a refresh schedule is justified.
- Do not invent API endpoints, station IDs, coordinates, current readings, licenses, or update frequencies.
- Manual observation and existing pond logs remain available when external sources fail.
- Use simple, explainable rules; no unsupported “water will spoil” predictions.
- Do not change unrelated app features.

## 3. Existing stack to preserve

- React + Vite + TypeScript
- Tailwind CSS
- Vercel deployment and existing Vercel-compatible server/API routes
- PostgreSQL + Prisma
- TanStack Query for client-side API fetching, caching, and invalidation
- Existing in-app alerts, if present
- cron-job.org only if scheduled refresh is justified after validation

Inspect the actual repository first and follow its patterns. Do not add duplicate libraries or a new framework.

## 4. Candidate data sources to verify

### A. ThaiWater / Hydro-Informatics Institute (HII)

Official documentation: https://standard.thaiwater.net/docs/

Investigate documented data types such as rainfall, runoff/water level, and water quality.

- Verify real endpoints, authentication, parameters, units, station metadata, sample frequency, timestamps, rate limits, and terms.
- Identify stations relevant to Samut Songkhram, especially the Mae Klong river/canal network and the farm's actual water source.
- Record station ID, official name, coordinates (only if verified), parameters, units, latest observation time, and relevance to the farm.
- If access or terms cannot be verified, mark the integration blocked/not configured and retain a manual fallback.

Do not assume a station is relevant merely because it is in the same province. Prefer stations in the same connected water system.

### B. Hydrographic Department, Royal Thai Navy — tide tables

Official page: https://hydro.navy.mi.th/waterlaveltable

- Verify the current official tide table and exact station label for the Mae Klong estuary / Pak Nam Mae Klong.
- Determine whether a documented API exists or only an official downloadable file is available.
- If there is no documented API, do not invent one or scrape fragile pages. Document a manual/import approach if practical and permitted.
- Store predicted high/low tide times and predicted level/unit only if the source provides them.

A tide table is a prediction for its named station, not a measurement of the farm's canal or pond.

### C. Open Government Data Thailand — candidate high-tide dataset

Candidate: https://data.go.th/en/dataset/disaster_2569_145

Verify publisher, file format, data dictionary, license/terms, coverage, and update cadence. Check whether it duplicates the Hydrographic Department source. Do not assume a dataset labelled for a particular year is continuously updated.

### D. Pollution Control Department (PCD) — IWIS

Official portal: https://iwis.pcd.go.th/

Identify nearby water-quality monitoring stations and available parameters such as dissolved oxygen (DO) or salinity.

- Verify whether a documented API, downloadable file, or explicitly permitted access method exists.
- If no suitable programmatic access is confirmed, document the limitation; do not build brittle scraping into the MVP.
- Do not use a far-away or hydrologically disconnected station as a direct substitute for pond water quality.

### E. Optional weather supplement — Open-Meteo

Documentation: https://open-meteo.com/en/docs

Use only as an optional rainfall/forecast supplement. Check current free-tier and commercial-use terms before real farm use. Do not make critical alerts depend on a plan whose terms are unsuitable.

## 5. Milestone 1 — Data discovery and station setup [COMPLETED ✅]

1. Inspect repository, Prisma schema, API patterns, and alert model. [DONE]
2. Add only missing farm water-source/location and station fields/models (`Farm` location fields, `ReferenceStation`, `EnvironmentalReading`). [DONE]
3. Configure farm location and water source: province/subdistrict, coordinates, canal name, tidal influence, water path notes. [DONE]
4. Build a list of station candidates using verified official metadata (Samut Songkhram target area). [DONE]
5. Test one useful source end-to-end (Open-Meteo tested end-to-end server-side; real live data fetched and normalized). [DONE]
6. Document sources and findings in `docs/water-data-sources.md`. [DONE]

### Milestone 1 Status & Verification Results

- **Open-Meteo:** VERIFIED ✅. Live REST API tested and functioning for Samut Songkhram coordinates (`13.4098, 99.9965`). Normalization strictly separates `observedAt` and `fetchedAt`, performs freshness checks (>3h = STALE), and validates physical ranges.
- **Royal Thai Navy Hydrographic Dept (Pak Nam Mae Klong):** CANDIDATE (PDF Manual/Batch Fallback). Verified that official tide prediction tables (`MK2026.pdf` / `MK2026mls.pdf`) exist for Pak Nam Mae Klong. No public REST API exists.
- **ThaiWater / HII (standard.thaiwater.net):** BLOCKED ❌. Portal defines national water exchange dictionary/standards (e.g. A001.1), but does not expose an open unauthenticated public API for third-party apps without an inter-agency MoU.
- **PCD IWIS (iwis.pcd.go.th):** BLOCKED ❌. Web portal dashboard only; backend API endpoints return 404 or require internal auth. Handled via in-pond manual logs.
- **data.go.th:** BLOCKED ❌. Static annual reporting datasets, unsuitable for dynamic live monitoring.

### Acceptance criteria verification

- [x] No invented station IDs or coordinates.
- [x] At least one real source (Open-Meteo) is fetched end-to-end in dev; blockers and manual fallback documented for others.
- [x] Each station/source records URL, access method, parameters, units, timestamp behavior, and verification status.
- [x] UI distinguishes verified, candidate, unavailable, and stale sources (`EnvironmentalCard`).
- [x] No alert is generated from unverified or stale values.
- [x] Automated unit and normalization tests added in `tests/environmental.test.ts` (100% passing).
- [x] Production build and TypeScript validation pass without errors.

## 6. Milestone 2 — Minimal water-risk view (later)

Add one compact section to the existing dashboard, not a separate analytics platform.

Display latest rainfall observation/forecast, relevant observed water level if available, next predicted high/low tide if verified, relevant source-water-quality readings if available, timestamps, source, and freshness. Explain why each item may matter to the farm.

Suggested labels:

- `เฝ้าระวัง`
- `ควรตรวจน้ำ`
- `ข้อมูลไม่เพียงพอ`
- `ข้อมูลเก่า`
- `ยังไม่มีสถานีอ้างอิง`

Never show a green “safe” status just because no warning was generated.

## 7. Milestone 3 — Explainable rules (later)

Start with a few configurable, documented rules.

- **Rainfall:** when verified rainfall/forecast crosses a configured threshold, suggest checking canal/pond levels, salinity, and water condition before exchange. Thresholds must be validated; do not invent a universal value.
- **Predicted high tide:** remind the farmer to check actual canal level around the predicted window. Tide prediction is not actual canal level.
- **Source-water anomaly:** alert only when a relevant station has a verified reading outside a documented threshold. Include parameter, value, unit, observation time, source, and threshold.
- **Pond-level evidence:** use actual pond logs such as low DO or unusual mortality according to configurable, sourced thresholds. Keep this distinct from environmental alerts.

Alert hygiene:

- Use deduplication keys and cooldown.
- Save rule, source observation time, generated time, severity, message, and status.
- Avoid repeated alerts for unchanged conditions.
- Never automatically open/close gates.

## 8. Minimal data model changes

Inspect the existing Prisma schema and reuse current models. Add only missing pieces.

Possible additions:

- `WaterSource` or equivalent fields on existing Farm/Pond.
- `ReferenceStation`: provider, providerStationId, officialName, coordinates, parameters, units, source URL, relevance notes, verification status, last checked.
- `EnvironmentalReading`: stationId, parameter, value, unit, observedAt, fetchedAt, quality/freshness status, source record ID.
- Extend existing `Alert` with source/rule references and dedupe key only if not already supported.

Do not add a separate table per provider or store large duplicate payloads without a concrete need.

## 9. API and integration design

- Fetch external data server-side, not directly from the browser.
- Keep credentials server-side.
- Normalize provider responses to station, parameter, value, unit, observedAt, fetchedAt, source URL, and quality status.
- Validate external responses before storing/displaying.
- Add timeouts and graceful failure handling.
- Cache responses where practical.
- Use TanStack Query for the app's own API and invalidate relevant queries after updates.
- Do not add another data-fetching library if TanStack Query is already installed.

## 10. Scheduling

Do not add scheduled jobs in Milestone 1. After source fetching works, decide how fresh data needs to be. If cron-job.org is used, call a protected endpoint with a long random secret. Make jobs idempotent, deduplicate alerts, and record last attempt/success/error. Never assume a job succeeded without checking.

## 11. Security and data quality

- Follow existing authentication and authorization conventions.
- Treat missing, stale, malformed, or station-mismatched data as unknown.
- Store observedAt separately from fetchedAt.
- Do not expose provider credentials in client bundles.
- Label demo data clearly.
- Keep manual observations available during outages.
- Respect source attribution and license/terms.
- Use only the farm location necessary for the feature.

## 12. Tests

- Provider response normalization and unit handling.
- Stale, missing, and malformed observations.
- Station verification/relevance gating.
- Rule evaluation and alert deduplication/cooldown.
- Tide prediction must not imply observed canal level.
- API authorization and error paths.
- Run the repository's existing lint, typecheck, tests, Prisma validation, and build commands.

## 13. Out of scope

- AI/ML water-quality prediction or disease diagnosis.
- Automatic water-gate control.
- IoT installation/device fleet management.
- Microservices, queues, Redis, data warehouse.
- Multiple competing weather APIs.
- Undocumented scraping.
- Push/email notifications unless already present and specifically needed.
- Claiming a pond is safe based on absent warnings.

## 14. Deliverables

- Working changes in the existing repository.
- Updated implementation plan with status, decisions, and blockers.
- `docs/water-data-sources.md` listing source URLs, real access method, terms/license verification, station candidates, parameters, units, timestamps, and limitations.
- Updated `.env.example` only if needed.
- Tests for normalization, freshness, and alert rules where implemented.
- Final report with changed files, actual commands/results, verified integrations, blockers, and next step.

## 15. First action

Inspect the existing app and implement **Milestone 1 only**. Do not start Milestones 2 or 3 until source/station verification is documented. If exact farm coordinates are unavailable, build the configuration flow without guessing coordinates.

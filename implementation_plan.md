# บ่อดี (BODI) — Lean MVP Implementation Plan

**Tagline:** รู้ทันบ่อ ดูแลง่าย ขายได้ราคา  
**Product:** Smart Aquaculture Farm Management  
**Version:** Lean MVP v1

## 1. Product Goal

Build a simple Thai-first web app for a small family-run shrimp, crab, and shellfish farm. บ่อดี replaces scattered notebooks with one easy place to record pond activity, water observations, mortality, income, and expenses.

**Build the useful logbook first. Do not build a full smart-farm platform in v1.**

### Real farm constraint

The farm may use natural/semi-natural methods: shrimp may enter through canal water and formulated feed may not be used. Stocking dates/counts and feed are optional. Never force the user to invent data.

## 2. Anti-Overengineering Rules

- One web app, one codebase, one database.
- No microservices, message queues, event bus, complex repository abstractions, or separate data warehouse.
- No IoT hardware requirement in v1.
- No AI diagnosis or prediction claims in v1.
- No scheduled jobs until a feature genuinely needs one.
- No external API dependency for core workflows.
- Prefer a simple form and a clear summary over charts and configurable dashboards.
- Use only the database tables and dependencies needed for current features.
- Do not build generic frameworks for hypothetical future features.
- Every feature must have a clear user benefit and a testable acceptance criterion.
- Keep the app useful when internet data providers or AI are unavailable.

## 3. MVP — Build Only These Features

### A. Farm and ponds

- One farm initially; support multiple ponds.
- Create/edit pond: name, area (optional), water source, species, farming method, notes, active/resting/harvested status.
- Culture cycle is optional and lightweight: species, start date if known, end date if known, notes.
- Do not require feed records, exact stocking counts, or intensive-farm fields.

### B. Quick daily log

Provide a short form for:

- Water quality: temperature, pH, salinity, dissolved oxygen (DO), all optional if not measured.
- Water exchange: in/out, date/time, notes.
- Animal observation: behavior, visible symptoms, approximate mortality, photo (optional), notes.
- Harvest: date, species, quantity/unit, sale price (optional).
- A general note.

Every record has a timestamp and the pond it belongs to. Show “not measured” rather than assuming a value.

### C. Income and expenses

- Add income/expense with date, amount, category, optional pond, and note.
- Show totals for the current month and selected date range.
- Show estimated profit only when the underlying records support it; clearly label it as an estimate.
- CSV export can be added after core CRUD is stable.

### D. Home dashboard

Show only:

1. Alerts that need attention.
2. Latest water reading for each pond, including its timestamp.
3. Recent mortality/observations.
4. This month’s income, expenses, and net amount.
5. Large quick-action buttons: record water, record mortality, add income/expense.

Avoid a chart-heavy dashboard. Missing or stale readings must show “ไม่มีข้อมูลล่าสุด”, not “ปกติ”.

### E. Simple rules and in-app alerts

- Start with a few explicit, documented rules only.
- Alert on a user-entered critical observation or a configured water threshold.
- Display why the alert appeared and when the underlying record was entered.
- Allow marking an alert as reviewed/resolved.
- Do not send push/email notifications in v1.
- Do not add Cron unless a real scheduled workflow exists.

## 4. Later — Only After the MVP Is Used

### Phase 2: Reference data and external information

- Species lifecycle, common risks and disease reference pages using reviewed sources.
- Weather forecast and rainfall risk indicators.
- Market prices, with source, market/region, grade/size, unit and observed date.
- Department of Fisheries datasets where a verified public API or downloadable dataset exists.
- Manual entry must remain available. Never fabricate live data or an official API.

### Phase 3: Gemini photo assistant

- User submits a photo of a dead/abnormal animal and optional symptoms.
- Call Gemini from the server only; keep the API key private.
- Present visible observations and possible explanations with uncertainty, not a definitive diagnosis.
- Offer safe checks and advise contacting an aquatic animal health professional/lab for severe or mass mortality.
- Never prescribe medicine, antibiotics, pesticides, or chemical treatment.
- Add upload limits and usage/rate controls. If Gemini is unavailable or quota is exhausted, the rest of the app still works.

### Phase 4: IoT pilot

- Only consider sensors after manual records show which measurements are useful.
- Start with one pond/station, not the whole farm.
- Manual entry remains a fallback; disconnected/stale sensors mean unknown, not safe.
- Verify real hardware, waterproofing, calibration, power, connectivity and maintenance costs before buying.

## 5. Simple Tech Stack

- React + TypeScript + Vite + TanStack(if necessary)
- Tailwind CSS
- Vercel for deployment
- PostgreSQL + Prisma
- Zod for validating API inputs
- Gemini API later, server-side only
- cron-job.org only if scheduled tasks become necessary and the chosen hosting plan cannot support them

Use one Vercel-compatible app and server/API routes. Do not add a separate backend service, Redis, a queue, or extra infrastructure unless a concrete requirement appears.

**Free-tier note:** free plans, quotas, sleeping behavior, backup features and commercial-use terms can change. Verify them before real operational use. Keep core workflows independent of optional providers.

## 6. Minimal Data Model

Start with these tables only:

- `User`: minimum authentication fields.
- `Farm`: id, name, timezone, createdAt.
- `Pond`: id, farmId, name, area?, waterSource?, species?, farmingMethod?, status, notes?.
- `PondLog`: id, pondId, type, recordedAt, validated structured fields, notes?, photoRef?.
- `FinanceTransaction`: id, farmId, pondId?, type (INCOME/EXPENSE), category, amount, occurredAt, note?.
- `Alert`: id, pondId?, title, message, severity, createdAt, status, dedupeKey?.

Use proper typed columns for commonly queried data. If using structured JSON in `PondLog`, validate each log type with Zod and avoid opaque JSON for fields that must be filtered or reported. Add tables for future features only when their phase is approved.

Use Prisma migrations, decimal-safe money fields, and basic indexes for pond/date and farm/date queries.

## 7. UI Rules for Older Users

- Thai-first language.
- Large readable text, big buttons, high contrast and generous spacing.
- Use familiar labels and explain terms like DO (ออกซิเจนละลายในน้ำ).
- Common daily records should take five taps or fewer where practical.
- Icons must have text labels.
- Show clear loading, empty, success and error states.
- Make editing mistakes easy to correct; confirm destructive actions.
- Use Asia/Bangkok for display and store timestamps consistently.
- Do not require the user to configure complex dashboards or rules to get value.
- Brand tone: friendly, practical, trustworthy; avoid overly technical language.

## 8. Security and Reliability

- Keep database credentials, Gemini key and cron secret on the server.
- Authenticate users and verify farm/pond access on protected routes.
- Validate request bodies with Zod.
- Validate photo type and size before AI processing.
- Use Prisma migrations rather than production `db push`.
- Handle missing data and external-provider failure gracefully.
- Add tests for finance totals, access control, log validation and alert rules.
- Provide `.env.example`, README setup steps, seed/demo data and deployment instructions.

## 9. Milestones and Definition of Done

### Milestone 1 — App foundation `[COMPLETED]`

- [x] **React, TypeScript, Tailwind and Vercel build work:**
  - Setup with React 19, TypeScript, Vite, Tailwind CSS v4.
  - Production build verified (`npm run build` completed cleanly, generating optimized assets).
  - Configured `vercel.json` for one-click Vercel deployment.
- [x] **PostgreSQL and Prisma schema & seed ready:**
  - Implemented Prisma schema (`prisma/schema.prisma`) with minimal core models: `User`, `Farm`, `Pond`, `PondLog`, `FinanceTransaction`, `Alert`.
  - Prisma client generated (`npm run prisma:generate`).
  - Migration script created (`prisma/migrations/20261010190000_init_aquaculture_schema/migration.sql`).
  - Seed script ready (`prisma/seed.ts`) with realistic Thai natural/semi-natural shrimp & crab farm demo data.
  - Prisma validation passed (`npx prisma validate`).
- [x] **API validation and Serverless architecture:**
  - Configured Zod schemas in `api/_lib/validators.ts` for all domain inputs.
  - Vercel Serverless Function `api/health.ts` for health checks with Asia/Bangkok timestamps.
  - Unit tests created and verified with Vitest (`npm test` passed 10/10 tests).
- [x] **Environment variables & Documentation:**
  - Documented in `.env.example` and `README.md`.
  - No secrets present in client code.
  - Real database setup instructions provided (fallback/blocker noted: local PostgreSQL server on localhost:5432 needs active instance or connection string to run live migration/seed).

### Milestone 2 — Ponds and daily logs

- User can create/edit a pond and add water, water-exchange, observation/mortality, harvest and general records.
- Natural/semi-natural farming works without feed or exact stocking data.
- Lists show timestamps and support correcting mistakes.

### Milestone 3 — Finance and dashboard

- Income/expense CRUD and monthly totals work.
- Dashboard shows latest pond records and missing/stale data correctly.
- Layout is usable on a phone.

### Milestone 4 — Basic alerts

- A small number of documented rules create understandable in-app alerts.
- Duplicate alerts are avoided.
- User can mark alerts reviewed/resolved.

### Milestone 5 — Evaluate before expanding

Ask actual farm users what they used, what was confusing, and what decisions the data helped with. Add weather, market data, Gemini or IoT only when there is a concrete need.

## 10. Out of Scope for V1

- IoT sensors and device fleet management.
- AI disease diagnosis or mortality prediction.
- Automated market price scraping.
- Unverified government API integrations.
- Push notifications, email delivery and scheduled jobs.
- Complex accounting, inventory, payroll or multi-branch ERP.
- Microservices, queues, analytics warehouse and elaborate permission systems.

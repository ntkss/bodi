# Gemini Prompt — Build บ่อดี (BODI), the Lean Smart Aquaculture MVP

You are a pragmatic senior full-stack engineer. Read `implementation_plan.md` and `SKILL.md` before coding. Build the working MVP, not just a mockup and not an over-engineered platform.

## Brand

- Thai name: บ่อดี
- English/technical name: BODI
- Product descriptor: Smart Aquaculture
- Tagline: รู้ทันบ่อ ดูแลง่าย ขายได้ราคา
- Brand personality: friendly, practical, trustworthy, clear, and welcoming to older farmers.
  Use the brand name consistently in the UI, README, document titles, seed/demo labels, and page metadata. Do not rename technical packages or repository paths unless explicitly asked.

## Product

A Thai-first, mobile-friendly web app for a small family-run shrimp, crab, and shellfish farm. The farm may be natural/semi-natural: shrimp may enter through canal water and feed may not be used. Never make stocking dates/counts or feed mandatory.

## Required stack

- React + TypeScript + Vite + TanStack(if necessary)
- Tailwind CSS
- Vercel
- PostgreSQL + Prisma
- Zod for API validation
- Gemini only in a later phase, through server-side code
- cron-job.org only if a real scheduled task is needed

## Hard anti-overengineering constraints

- One codebase and one deployable app.
- No microservices, Redis, queues, event bus, data warehouse, or separate backend service.
- Do not add dependencies or abstractions without a concrete current use.
- Do not build IoT, AI analysis, weather/market sync, push notifications or Cron in the first MVP.
- Do not fabricate external data or pretend integrations are live.
- Keep forms simple, Thai-first and easy for older users.
- Prioritize complete CRUD flows and correctness over decorative features.
- Implement one milestone at a time; run checks before proceeding.
- Keep the codebase clean, human friendly (readable codebase) and well documented.

## MVP features

1. Farm and pond CRUD; one farm can have multiple ponds.
2. Optional lightweight culture details. Natural/semi-natural methods must work without feed or exact stocking data.
3. Quick pond logs: water quality (temperature, pH, salinity, dissolved oxygen), water exchange in/out, animal observations/mortality, harvest, and general notes. All measurements can be absent when not measured.
4. Finance: income/expense, category, date, amount, optional pond and note; monthly totals.
5. Dashboard: attention alerts, latest reading per pond with timestamp, recent mortality/observations, monthly income/expenses/net, and quick-action buttons.
6. Simple in-app alerts based on a few documented rules. No push/email or scheduled job in v1.
7. README, `.env.example`, Prisma schema/migrations, seed/demo data, and tests for critical logic.

## UX

- Thai language by default.
- Large text, large touch targets, high contrast, clear labels and timestamps.
- Common tasks should take five taps or fewer where practical.
- Show “ไม่มีข้อมูลล่าสุด” when readings are missing or stale; never infer that the pond is safe.
- Include loading, empty, success and error states.
- Do not overuse charts, tables or jargon.
- Use the brand “บ่อดี” naturally, without plastering the logo on every panel.

## Data and engineering

- Use one simple Vercel-compatible app architecture.
- Use Prisma migrations and decimal-safe money fields.
- Validate API input with Zod.
- Authenticate users and enforce farm/pond access before storing real farm data.
- Keep secrets server-side.
- Use Asia/Bangkok for display.
- Add only tables needed by the current milestone. Start with Farm, Pond, PondLog, FinanceTransaction, Alert, and minimum auth tables required.
- Keep common query paths indexed.
- Handle database/provider failures with clear messages.
- Do not put uploaded image binaries in PostgreSQL.

## Future features: do not implement until asked after MVP review

- Weather forecast and rainfall risks.
- Market prices and Department of Fisheries reference data, only from verified sources.
- Gemini image assistant with uncertainty and safe escalation; no definitive diagnosis or medication prescription.
- IoT sensors, beginning with a one-pond pilot.
- cron-job.org or Vercel Cron, only when scheduled work is genuinely needed.

## Workflow

1. Inspect repository state.
2. Summarize the current architecture and identify the smallest next step.
3. Implement Milestone 1 only: app foundation, database connection, Prisma schema/migration, seed and documentation.
4. Run lint, typecheck, Prisma validation, tests and production build where configured. Report actual results.
5. Continue to the next milestone only after the current one passes.
6. If credentials are missing, create `.env.example` and explain setup; do not claim the integration works.
7. Keep `implementation_plan.md` updated with completed/in-progress/blocked status.
8. Finish with changed files, commands run/results, setup instructions and remaining work.

Start by inspecting the repository. Do not replace existing working code without explaining why.

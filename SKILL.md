# SKILL.md — บ่อดี (BODI) Project Rules

## Brand identity

- Product name in Thai: บ่อดี
- English/technical name: BODI
- Product descriptor: Smart Aquaculture
- Tagline: รู้ทันบ่อ ดูแลง่าย ขายได้ราคา
- Tone: friendly, practical, trustworthy and easy to understand.
- Use Thai as the default user-facing language. Keep technical identifiers in English where appropriate.
- Do not invent a logo, trademark status, domain availability or social handle availability. A logo can be designed separately.

## North star

Build the smallest dependable app that helps a real farm record daily work and make better decisions. Prefer proven, understandable solutions over clever architecture.

## Non-negotiable anti-overengineering rules

1. One app, one codebase, one database.
2. No microservices, Redis, queues, event bus, data warehouse, or separate backend unless a concrete measured need emerges.
3. No IoT, AI, external data sync, push notifications or Cron in the first MVP (We will do this in next phases).
4. Do not create generic abstractions for hypothetical future features.
5. Add a dependency only when it solves a current requirement.
6. Prefer complete end-to-end user flows over placeholder screens.
7. Keep manual entry as a first-class workflow.
8. Every feature must have a clear user benefit and a testable acceptance criterion.

## Farm-specific rules

- Support natural/semi-natural shrimp, crab and shellfish farming.
- Stocking date/count and feed are optional; never force made-up data.
- A missing or stale reading is unknown, not normal/safe.
- Keep water readings, observations, market data and weather data distinct.
- Never fabricate official datasets, API integrations, market prices or sensor readings.

## UX rules

- Thai-first and mobile-first.
- Design for older/non-technical users: readable text, large buttons, high contrast, familiar wording and visible timestamps.
- Common record flows should take five taps or fewer where practical.
- Avoid chart-heavy dashboards, dense tables, unexplained jargon and complex settings.
- Show clear loading, empty, success and error states.
- Make corrections easy and confirm destructive actions.
- Use the บ่อดี brand consistently but unobtrusively.

## Engineering rules

- Use React + TypeScript + Vite + Tailwind, Vercel, PostgreSQL and Prisma.
- Validate request bodies with Zod.
- Use Prisma migrations; do not use production `db push` as the migration strategy.
- Use decimal-safe fields for money.
- Authenticate users and enforce farm-level authorization on protected routes.
- Keep secrets out of client bundles.
- Store timestamps consistently and display in Asia/Bangkok.
- Add indexes only for real query paths.
- Keep external providers behind small adapters only when implementing that integration.
- Handle provider outages without breaking core farm logging.
- Keep the codebase clean, human friendly (readable codebase) and well documented.

## AI and animal-health safety (future phase)

- Gemini calls must be server-side.
- Treat image analysis as preliminary, uncertain assistance—not a definitive diagnosis.
- Never prescribe medicines, antibiotics, pesticides or chemical treatment based on a photo.
- For mass mortality or severe symptoms, advise contacting an aquatic animal health professional or laboratory.
- Add upload validation, consent, rate limits and graceful quota handling before enabling AI.
- AI token guard.

## Jobs and notifications

- In-app alerts first.
- No Cron until there is a real scheduled task.
- Secure scheduled endpoints and make them idempotent if jobs are later introduced.
- Deduplicate alerts and avoid notification spam.
- Verify current hosting/provider limits rather than assuming schedules or free tiers are unlimited.

## Workflow

1. Inspect existing code before editing.
2. Read and follow `implementation_plan.md`.
3. Implement one milestone at a time.
4. Run available lint, typecheck, tests, Prisma validation and production build; never claim a check passed unless it ran.
5. Add tests for finance calculations, authorization, log validation and alert rules.
6. Keep README and `.env.example` accurate.
7. If credentials or verified external sources are unavailable, document the blocker and retain a manual fallback.
8. Report changed files, commands run, results, blockers and next steps honestly.
9. Before starting a new feature, update `implementation_plan.md` with the plan and status.
10. code quality checks, lint, typecheck, prettier, tests, Prisma validation and production build, run this only before push to main branch

## Definition of done

A feature is complete only when the main flow works end-to-end, inputs are validated, access is protected, errors/empty states are handled, mobile layout is usable, and critical behavior is tested.

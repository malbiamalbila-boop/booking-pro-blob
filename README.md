# BookingPro Fleet Ops

Internal fleet and reservation management workspace for a Bosnian car rental operator. Built on Next.js 14 (App Router) and tuned for Vercel deployment with Postgres, KV, Blob Storage, Queues, and Cron schedules.

## Features
- Drizzle schema covering fleet, pricing, reservations, handover, damages, telemetry, and RBAC.
- Informational pricing engine and availability search (no payments).
- Reservation lifecycle flows with handover checkout/checkin notes and photo blobs.
- Queue handlers for PDF generation, notifications, telemetry rules, and report exports.
- Cron-driven operational digests and cleaning syncs.
- Tailwind-based operations UI for schedule, reservation creation, reservation detail, and admin consoles.
- OpenAPI 3.1 documentation available at `/api/docs`.

## Getting Started

### Prerequisites
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)
- Node.js 18+

### Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Populate with credentials from Vercel Dashboard (`Storage` → Postgres/KV, `Storage` → Blob, `Queues`, `Edge Config`).
3. Pull remote environment (optional):
   ```bash
   vercel env pull .env.local
   ```
4. Run database migrations & seed:
   ```bash
   npm run db:migrate
   npm run seed
   ```
5. Start the local dev server (uses `vercel dev` for parity):
   ```bash
   npm run dev
   ```

### Deploying to Vercel
1. Link the project:
   ```bash
   vercel link
   ```
2. Provision managed resources in the Vercel Dashboard:
   - Postgres (Neon)
   - KV Store
   - Blob Storage
   - Queues (pdf_generation, notifications, telematics_rules, report_exports)
   - Edge Config entry for feature flags (pricing yield)
3. Set environment variables via `vercel env` or dashboard.
4. Trigger a deployment:
   ```bash
   vercel deploy
   ```

## Data Model & Migrations
Drizzle schema lives in `lib/db/schema.ts`. Generate migrations with `npm run db:generate` and apply via `npm run db:migrate`. Demo data can be loaded using `npm run seed` which inserts branches, rate plans, vehicles, 10 reservations, and baseline settings.

## API Surface
- Availability & Pricing: `/api/availability`, `/api/pricing/quote`
- Reservation lifecycle: `/api/quotes`, `/api/reservations`, `/api/reservations/[id]`
- Handover flows: `/api/handover/[reservationId]/checkout`, `/api/handover/[reservationId]/checkin`
- Reporting & exports: `/api/reports/*`, `/api/export/csv`
- Calendar feed: `/api/calendar/[vehicleId].ics`
- Admin CRUD under `/api/admin/*`
- Telematics webhook: `/api/webhooks/telematics`

Full contract documented in `openapi/openapi.yaml` and served via `/api/docs`.

## Testing
Run unit tests via:
```bash
npm test
```
Tests cover pricing engine logic, availability calculations, reservation flow helpers, and handover differentials.

## Assumptions
- Pricing remains informational; totals stored for auditing, no payment capture.
- Queue consumers are triggered by Vercel Queues; this repo provides handlers but not producers beyond demo stubs.
- Blob uploads use signed URLs with client-side upload steps handled in UI components (not included in API handlers).
- Telematics events arrive via HMAC-signed POST payloads using `TELEMATICS_WEBHOOK_SECRET`.
- Auth uses email magic link or credentials via NextAuth; adapters connect to Postgres/KV but mail delivery is mocked for local dev.
- Sarajevo/BiH specific: BAM as primary currency, optional EUR/SEK display toggles, and Zeleni karton enforced for cross-border trips.

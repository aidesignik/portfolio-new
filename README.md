# Atlas — digital dispatcher for coach transport

MVP for a platform that lets a single bus/coach carrier run their booking pipeline end to end — client request → carrier offer → confirmed booking → generated documents — without phone calls and email back-and-forth.

This is the first build increment. See "Deferred to later increments" below for what's intentionally out of scope for now.

## Stack

- Next.js (App Router) + TypeScript, Tailwind CSS
- Prisma + PostgreSQL
- NextAuth (Credentials + JWT sessions)
- next-intl (Serbian + English, `sr`/`en`)
- `@react-pdf/renderer` for contract/confirmation/invoice PDFs

## Getting started

Prerequisites: Node 20+, a local PostgreSQL 16 instance (or Docker).

```bash
cp .env.example .env
# start Postgres — either:
docker compose up -d
# or point DATABASE_URL in .env at an existing local Postgres

npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000 (redirects to `/sr`, switch to `/en` in the navbar).

### Seeded accounts

`npm run db:seed` creates:

| Role    | Email                  | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@example.com       | admin1234   |
| Carrier | carrier@example.com     | carrier123  |
| Client  | client@example.com      | client123   |

The seeded carrier is pre-approved with a demo vehicle and driver, so you can log in and immediately submit a request as the client, then send an offer as the carrier.

## How the pieces fit together

- **Roles**: `User.role` is `CLIENT`, `CARRIER`, or `ADMIN`. A new carrier signup creates a `Carrier` row with `status: PENDING`; an admin must approve it (`/admin/carriers`) before the carrier's dashboard, fleet, drivers, calendar, requests inbox and bookings become reachable — the carrier can still fill in their profile while pending.
- **Booking flow**: client submits a `BookingRequest` → any approved carrier can open it and submit an `Offer` (picking one of their vehicles/drivers, entering distance in km) → the system suggests a price (`src/lib/pricing.ts`) and blocks the offer if the chosen vehicle/driver conflicts with an existing confirmed booking (`src/lib/availability.ts`) → the client accepts one offer, which creates a `Booking` and auto-rejects the request's other pending offers → either side can generate and download PDF documents (confirmation, contract, invoice) for the booking.
- **No real AI dispatcher yet**: `src/lib/distance.ts`, `src/lib/pricing.ts` and `src/lib/availability.ts` are the deterministic stand-ins described in the product plan — swappable behind their current interfaces once a real routing/matching engine is built.
- **Documents**: generated on demand via `src/lib/documents/generate.ts` using `@react-pdf/renderer`, written to local disk under `storage/documents/` (gitignored) behind a small storage abstraction (`src/lib/documents/storage.ts`) so swapping in S3/Blob storage later is a one-file change.

## Deferred to later increments

Real AI dispatcher/matching, real maps/geocoding/routing API, e-invoicing/fiscalization, multi-carrier marketplace matching, payments, email/SMS notifications, a real file/photo upload pipeline, admin commission tracking and complaints handling, round-trip/multi-leg requests, automated request/offer expiry jobs.

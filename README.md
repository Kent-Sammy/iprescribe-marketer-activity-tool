# Marketer Activity & Field Reporting Tool

Internal tool for marketers to submit field reports after visiting healthcare
facilities (pharmacies, hospitals/clinics, laboratories), and for the admin team
to see **what each marketer did, where they went, who they met, and what
happened**.

> **Status: frontend prototype.** Authentication is **mocked** and there are **no
> route guards** — every screen is freely navigable for demos and developer
> hand-off. Data (facilities, reports) runs on a per-browser mock store. Real
> auth (Clerk) and the data backend (Postgres + Prisma + Google geocoding) are
> later phases — see [Roadmap](#roadmap). `@clerk/nextjs` is kept as a dependency
> for that phase but is not wired into the app right now.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI primitives | shadcn/ui pattern (`src/components/ui/*`), Radix, lucide-react |
| State (mock) | React context + `localStorage` (`src/lib/mock/store.tsx`) |
| Dates | Native `Intl.DateTimeFormat` pinned to `Africa/Lagos` (`src/lib/datetime.ts`) |

## Getting started

Requires **Node.js 20+** and **pnpm** (npm/yarn also fine).

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

Other scripts:

```bash
pnpm build     # production build
pnpm start     # run the production build
pnpm lint      # eslint
pnpm format    # prettier --write .
```

## Authentication (mocked)

This phase is a **frontend prototype**. There is **no real authentication and no
route protection** — every screen is reachable directly by URL.

- **`/login`** — a visual login screen with a **Marketer / Admin** toggle:
  - **Marketer** — *Log in* (any/no input) → `/dashboard`. Or **Create an
    account** → dummy signup form → *Create account* → `/dashboard`. No OTP, no
    email verification, no account.
  - **Admin** — *Log in as Admin* (any/no input) → `/admin`. No signup option, no
    account required, no "couldn't find your account".
- The chosen role is stored in `localStorage` (`src/lib/auth/mock-session.tsx`)
  only so the top bar shows the right label; it does not gate anything.
- **No `middleware.ts`, no `<ClerkProvider>`, no role checks.** `@clerk/nextjs`
  stays in `package.json` for the future auth phase but is not imported anywhere.

Facilities/reports use a per-browser mock store (`src/lib/mock/`). Submitted
reports persist to `localStorage`; **Reset demo data** (top bar) restores the
seed.

### Screens

**Marketer** — `/login`, `/dashboard`, `/reports/new`, `/reports/new/success`,
`/reports` (My Reports), `/reports/[id]`.

**Admin** — `/admin`, `/admin/marketers`, `/admin/marketers/[id]` (activity +
daily, `?date=`), `/admin/daily`, `/admin/reports`, `/admin/reports/[id]`,
`/admin/facilities`, `/admin/facilities/[id]`.

## Project structure

```
src/
  app/
    (auth)/login/              # mock login / signup (no real auth)
    (marketer)/                # marketer shell + screens
    (admin)/admin/             # admin shell + screens
    layout.tsx, providers.tsx  # root layout + client providers
  components/
    ui/                        # shadcn primitives
    shared/                    # StatCard, badges, timelines, tables, report detail
    forms/                     # ReportForm wizard, FacilityCombobox, LocationCapture
    layout/                    # AppShell, ResetDemoData
    admin/                     # DailyActivityView
  lib/
    types.ts                   # domain types + enum label maps (mirror the schema)
    datetime.ts                # Africa/Lagos date helpers
    reporting.ts               # pure aggregation/filtering (future service-layer logic)
    geocoding.ts               # MOCK reverse geocoding (swap for Google later)
    nav.ts                     # nav config
    auth/mock-session.tsx      # MOCK session (localStorage role only, no guards)
    mock/
      data.ts                  # seed marketers / facilities / reports
      store.tsx                # in-memory + localStorage data store
  types/globals.d.ts           # session-claim types (dormant — for the future Clerk phase)
```

## Environment variables

**None are required in this phase.** `npm run build`, local dev, and the Vercel
deploy all work with no env vars — auth is mocked and the data is a mock store.

`.env.example` still lists the Clerk / Postgres / geocoding variables so they are
ready for the phases that reintroduce real auth and a data backend.

## What is still mocked, and how to replace it

| Mock | File | Replace with |
| --- | --- | --- |
| Data store (CRUD) | `src/lib/mock/store.tsx`, `src/lib/mock/data.ts` | Server Components calling `src/lib/services/*` (Prisma) for reads; Server Actions for writes. Selector hooks can stay as thin client wrappers if useful. |
| Reverse geocoding | `src/lib/geocoding.ts` | Server route calling the Google Geocoding API with a secret key. Keep `getAddressForCoords()` / `mapLink()` signatures. |
| Location capture | `src/components/forms/location-capture.tsx` | `navigator.geolocation.getCurrentPosition` + the geocode route. The `value` / `onChange` contract and the “must succeed before submit” rule stay the same. |

## Locked product decisions

- **Timezone:** `Africa/Lagos` defines every “today” / “this week”.
- **Location is mandatory** — a report cannot be submitted without a captured
  location; permission denied ⇒ clear error + retry, never a save.
- **Reports are immutable** after submission. The only post-submit change a
  marketer can make is marking their own follow-up complete.
- **Reverse geocoding provider:** Google (abstracted behind the service layer).
- Marketers never type their own name or the report date/time — the system adds
  them automatically.

## Roadmap

1. ✅ Frontend prototype on mock data + mock auth (current)
2. Real auth + role-based access control (Clerk) — middleware, `<ClerkProvider>`,
   role checks. `@clerk/nextjs` is already a dependency.
3. Data layer — Prisma schema, migrations, seed (Neon Postgres)
4. Wire Submit Report + dashboards to real data (Server Actions / Components)
5. Admin drill-downs on real data
6. Facilities on real data
7. Google reverse geocoding + real browser geolocation
8. Polish, tests

## Notes

- `next.config.mjs` currently sets `eslint.ignoreDuringBuilds: true` so a stray
  lint warning doesn’t block `next build`. Run `pnpm lint` directly; re-enable
  build-time lint when CI enforces it.
- No environment variables are needed to build or run this phase.

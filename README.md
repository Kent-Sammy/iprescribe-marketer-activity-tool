# Marketer Activity & Field Reporting Tool

Internal tool for marketers to submit field reports after visiting healthcare
facilities (pharmacies, hospitals/clinics, laboratories), and for the admin team
to see **what each marketer did, where they went, who they met, and what
happened**.

> **Status: frontend only.** This build is the complete UI running on **mock data
> and mock authentication**. There is no database, no real auth, and no server
> API yet. The backend (Postgres + Prisma + Auth.js + Google geocoding) is a
> later phase — see [Roadmap](#roadmap).

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

## Using the app (mock mode)

- The landing page redirects to **`/login`**. Auth is faked — any credentials
  work, and **“Log in”** drops you straight into the marketer workspace.
- The login screen also has **Quick access (dev)**: pick a marketer, or enter the
  **Admin** workspace.
- Once inside, the **top-bar role switcher** (flask icon) jumps between the admin
  experience and any marketer’s experience at any time.
- **No routes are guarded.** Every screen is reachable directly by URL.
- **Reset demo data** (top bar) restores the seeded dataset and clears any
  reports you submitted in the browser.
- Submitted reports are persisted to `localStorage`, so they survive a reload and
  appear across the marketer and admin screens.

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
    (auth)/login/              # mock sign-in
    (marketer)/                # marketer shell + screens
    (admin)/admin/             # admin shell + screens
    layout.tsx, providers.tsx  # root layout + client provider tree
  components/
    ui/                        # shadcn primitives
    shared/                    # StatCard, badges, timelines, tables, report detail
    forms/                     # ReportForm wizard, FacilityCombobox, LocationCapture
    layout/                    # AppShell, RoleSwitcher, ResetDemoData
    admin/                     # DailyActivityView
  lib/
    types.ts                   # domain types + enum label maps (mirror the schema)
    datetime.ts                # Africa/Lagos date helpers
    reporting.ts               # pure aggregation/filtering (future service-layer logic)
    geocoding.ts               # MOCK reverse geocoding (swap for Google later)
    nav.ts                     # nav config
    auth/mock-session.tsx      # MOCK auth — replace with Auth.js
    mock/
      data.ts                  # seed marketers / facilities / reports
      store.tsx                # in-memory + localStorage data store
```

## What is mocked, and how to replace it

| Mock | File | Replace with |
| --- | --- | --- |
| Authentication / session | `src/lib/auth/mock-session.tsx` | Auth.js v5. `useSession()` already returns `{ data, status }` like `next-auth/react`; swap the provider, delete `RoleSwitcher`, re-add middleware + per-service role checks. |
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

1. ✅ Frontend on mock data (this build)
2. Data layer — Prisma schema, migrations, seed (Neon Postgres)
3. Auth.js v5 (credentials), middleware, role checks
4. Wire Submit Report + dashboards to real data (Server Actions / Components)
5. Admin drill-downs on real data
6. Facilities on real data
7. Google reverse geocoding + real browser geolocation
8. Polish, tests, deploy to Vercel

## Notes

- `next.config.mjs` currently sets `eslint.ignoreDuringBuilds: true` so a stray
  lint warning doesn’t block `next build` during the mock phase. Run `pnpm lint`
  directly; re-enable build-time lint when CI enforces it.
- `.env.example` documents the variables the backend phases will need. None are
  required to run the current frontend.

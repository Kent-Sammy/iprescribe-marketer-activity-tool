# Marketer Activity & Field Reporting Tool

Internal tool for marketers to submit field reports after visiting healthcare
facilities (pharmacies, hospitals/clinics, laboratories), and for the admin team
to see **what each marketer did, where they went, who they met, and what
happened**.

> **Status.** Authentication is **real** (Clerk): marketer sign-up + sign-in,
> admin sign-in, role-based route protection via middleware. The rest of the app
> (facilities, reports data) still runs on a per-browser **mock store** until the
> data backend (Postgres + Prisma + Google geocoding) lands — see
> [Roadmap](#roadmap).

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

## Authentication & access control

Auth is handled by **Clerk**. See [Environment variables](#environment-variables)
for the required keys and the one dashboard setting.

- **`/login`** — one page with a **Marketer / Admin** sign-in toggle and a
  **Create marketer account** flow (email + password, with email-code
  verification).
- **Roles** come from Clerk `publicMetadata.role`. `"admin"` ⇒ admin; anything
  else ⇒ marketer. New sign-ups are marketers automatically.
- **Admin accounts have no public sign-up.** Create them in the Clerk dashboard
  and set `publicMetadata` to `{ "role": "admin" }`.
- **`src/middleware.ts`** enforces access on every request: unauthenticated →
  `/login`; non-admin on `/admin/*` → `/dashboard`; admin on the marketer
  workspace → `/admin`. Direct URL entry is covered.
- After login: marketer → `/dashboard`, admin → `/admin`.

Facilities/reports still use a per-browser mock store (`src/lib/mock/`). Submitted
reports persist to `localStorage`; **Reset demo data** (top bar) restores the
seed. A brand-new marketer account starts with no reports of its own; the admin
portal shows the full seeded dataset.

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
    (auth)/login/              # Clerk sign-in / marketer sign-up
    (marketer)/                # marketer shell + screens
    (admin)/admin/             # admin shell + screens
    layout.tsx, providers.tsx  # root layout (<ClerkProvider>) + client providers
  middleware.ts                # Clerk auth + role-based route protection
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
    auth/mock-session.tsx      # session adapter over Clerk (name kept for import stability)
    mock/
      data.ts                  # seed marketers / facilities / reports
      store.tsx                # in-memory + localStorage data store
  types/globals.d.ts           # Clerk session-claim types
```

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (and in a
local `.env.local`, copied from `.env.example`):

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk dashboard → API keys. `pk_test_…` for Preview/Dev, `pk_live_…` for Production. The build fails without it. |
| `CLERK_SECRET_KEY` | ✅ | Same page. `sk_test_…` / `sk_live_…`. Server-only. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | ✅ | `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | ✅ | `/login` |

**One required Clerk dashboard setting** — *Sessions → Customize session token* →
add this claim so middleware can read the role without an API call:

```json
{ "metadata": "{{user.public_metadata}}" }
```

To make an **admin**: Clerk dashboard → Users → (create/select user) → Metadata →
Public → `{ "role": "admin" }`.

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

1. ✅ Frontend on mock data
2. ✅ Real auth + role-based access control (Clerk)
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
- The Clerk keys (see [Environment variables](#environment-variables)) are
  required for `next build` and to run the app. The Postgres/geocoding vars in
  `.env.example` are for later phases and are not needed yet.

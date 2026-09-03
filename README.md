# Marketer Activity & Field Reporting Tool

Internal tool for marketers to submit field reports after visiting healthcare
facilities (pharmacies, hospitals/clinics, laboratories), and for the admin team
to see **what each marketer did, where they went, who they met, and what
happened**.

This is the **Next.js frontend**. It talks to the **iPrescribe API**
(`iprescribe-api`, Laravel) — real accounts, real Passport tokens, a real
database, and real Google reverse geocoding. There is no mock data left.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI primitives | shadcn/ui pattern (`src/components/ui/*`), Radix, lucide-react |
| Backend | iPrescribe API (Laravel + Passport), see [API](#the-api) |
| Auth | Passport bearer + rotating refresh token, held in `localStorage` |
| Dates | Native `Intl.DateTimeFormat` pinned to `Africa/Lagos` (`src/lib/datetime.ts`) |

## Getting started

Requires **Node.js 20+** and a running iPrescribe API.

```bash
cp .env.example .env.local     # point NEXT_PUBLIC_API_BASE_URL at your API
npm install
npm run dev
# open http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run format`.

### Environment

One variable, and it is required:

```
NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000/api"
```

Nothing secret lives here. The Google key, the database and the token signing
keys are all on the API side; the browser only ever sends coordinates and
credentials.

## The API

Everything this app needs was added to `iprescribe-api` under the
`api_marketer` Passport guard (marketers) and the existing `api_admin` guard
(admins). See that repo's `routes/marketer/*.php` and
`routes/admin/marketers.php`.

**One-time setup on any environment** (the marketer guard needs its own Passport
personal-access client, exactly like the pharmacy and laboratory guards):

```bash
php artisan migrate
php artisan passport:client --personal --provider=marketers \
  --name="Marketer Personal Access Client"

# optional demo data — three marketers, six Lagos facilities, two weeks of visits
php artisan db:seed --class=MarketerSeeder
```

### Endpoints

**Marketer** — `auth:api_marketer`, every read scoped to the token's owner:

| Method | Path |
| --- | --- |
| POST | `/v1/marketer/auth/register` · `/login` · `/refresh-token` |
| GET/POST | `/v1/marketer/auth/me` · `/verify` · `/logout` · `/change-password` |
| GET | `/v1/marketer/dashboard/stats` · `/dashboard/summary` |
| GET/POST | `/v1/marketer/facilities` |
| GET | `/v1/marketer/facilities/{id}` |
| GET/POST | `/v1/marketer/reports` |
| GET | `/v1/marketer/reports/{id}` |
| POST | `/v1/marketer/reports/{id}/complete-follow-up` |
| GET | `/v1/marketer/utils/reverse-geocode?latitude=&longitude=` |

**Admin** — `auth:api_admin`, read-only over reports and facilities:

| Method | Path |
| --- | --- |
| GET | `/v1/admin/marketer-dashboard/stats` · `/summary` |
| GET/POST | `/v1/admin/marketers` |
| GET | `/v1/admin/marketers/{id}` · `/{id}/active-dates` |
| POST | `/v1/admin/marketers/{id}/status` |
| GET | `/v1/admin/marketer-reports` · `/{id}` |
| GET | `/v1/admin/marketer-facilities` · `/{id}` |

Report and facility lists accept the same filters the UI exposes:
`marketer_id`, `facility_id`, `facility_type`, `outcome`,
`follow_up` (`REQUIRED|OPEN|COMPLETED|NONE`), `date`, `date_from`, `date_to`,
`search`, `sort`, `order`, `limit`.

Responses are the API's standard envelope — `{ data, message, status }`, with
list endpoints returning a Laravel paginator inside `data`. Enums travel in
`UPPER_SNAKE` (the DB stores `lower_snake`; the forms differ only by case), and
ids are Hashids, so the domain types in `src/lib/types.ts` are unchanged from
the prototype.

## Authentication

Marketers and admins are **separate actors on the API** — different tables,
different Passport guards — so the login screen's Marketer/Admin toggle chooses
an endpoint, not just a label.

- Marketers can self-register (`Create an account`) and are signed in straight
  away. Admin accounts are provisioned by an administrator; there is no admin
  signup.
- `src/lib/auth/session.tsx` holds the session, restores it from the stored
  token on reload, and exposes `useSession()` / `useCurrentUser()` /
  `useAuthActions()`.
- `<RequireRole>` guards both app shells: the wrong role is sent to its own
  home, no session at all to `/login`.
- `src/lib/api/client.ts` attaches the bearer token and, on a 401, rotates the
  refresh token once and retries before giving up.

## Project structure

```
src/
  app/
    (auth)/login/              # marketer + admin sign-in, marketer sign-up
    (marketer)/                # marketer shell + screens (RequireRole MARKETER)
    (admin)/admin/             # admin shell + screens  (RequireRole ADMIN)
    layout.tsx, providers.tsx  # root layout + client providers
  components/
    ui/                        # shadcn primitives
    shared/                    # StatCard, badges, timelines, tables, report detail
    forms/                     # ReportForm wizard, FacilityCombobox, LocationCapture
    layout/                    # AppShell
    admin/                     # DailyActivityView
  lib/
    api/
      client.ts                # fetch wrapper, envelope, tokens, refresh, paging
      auth.ts facilities.ts reports.ts marketers.ts dashboard.ts
    auth/session.tsx           # session state + <RequireRole>
    data/store.tsx             # live data store + selector hooks
    types.ts                   # domain types + enum label maps (mirror the API)
    datetime.ts                # Africa/Lagos date helpers
    reporting.ts               # pure aggregation/filtering (client-side)
    geocoding.ts               # reverse geocoding via the API
    nav.ts                     # nav config
```

### Screens

**Marketer** — `/login`, `/dashboard`, `/reports/new`, `/reports/new/success`,
`/reports` (My Reports), `/reports/[id]`.

**Admin** — `/admin`, `/admin/marketers`, `/admin/marketers/[id]` (activity +
daily, `?date=`), `/admin/daily`, `/admin/reports`, `/admin/reports/[id]`,
`/admin/facilities`, `/admin/facilities/[id]`.

## How data loading works

`src/lib/data/store.tsx` loads the collections the session is allowed to see
once, keeps them in React state, and exposes the selector hooks every screen
uses (`useReports`, `useFacilities`, `useMarketer`, …). Reads are scoped by
role — a marketer gets their own reports, an admin gets the team's — and that
scoping is enforced server-side too, so the marketer endpoints ignore any
marketer id sent from the client.

The dashboards then filter and aggregate those arrays client-side via
`src/lib/reporting.ts`. That keeps every screen synchronous and is fine at
internal-tool scale. **If a workspace outgrows it**, the API already exposes the
same filters and the same aggregates server-side — `src/lib/api/reports.ts` and
`src/lib/api/dashboard.ts` mirror `reporting.ts` definition for definition — so
screens can be moved over one at a time without touching the UI.

## Locked product decisions

- **Timezone:** `Africa/Lagos` defines every "today" / "this week", weeks start
  Monday. The API stores timestamps in the same zone, so both sides agree.
- **Location is mandatory** — a report cannot be submitted without a captured
  GPS reading; permission denied ⇒ clear error + retry, never a save. The
  reverse-geocoded address is best-effort: a geocoding outage leaves the address
  blank but still allows the submission.
- **Reports are immutable** after submission. The only post-submit change is the
  authoring marketer marking their own follow-up complete — enforced server-side.
- **Reverse geocoding provider:** Google, called from the API so the key never
  reaches the browser.
- Marketers never type their own name or the report date/time — the server adds
  them from the token and the clock.

## Notes

- `next.config.mjs` sets `eslint.ignoreDuringBuilds: true` so a stray lint
  warning doesn't block `next build`. Run `npm run lint` directly; re-enable
  build-time lint when CI enforces it.
- Facility and report ids are opaque Hashids, not integers — don't try to parse
  or order by them.

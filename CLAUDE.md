# ServiceHub

Production-quality service booking platform. This file is the spec: all work in this repo follows it.

## Purpose

- **Customers** browse services, book a date and time, and manage their bookings.
- **Admins** manage services, users and bookings from a dashboard.

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript 5 (`strict: true`)
- Tailwind CSS v4, shadcn/ui, lucide-react icons, sonner toasts
- Prisma 6 with PostgreSQL (Neon). `DATABASE_URL` comes from `.env`
- Auth: `bcryptjs` for password hashing, `jose` for a JWT stored in an httpOnly cookie
- Validation: `zod` schemas shared by forms and API; `react-hook-form` (+ `@hookform/resolvers/zod`) on the client
- Testing: Vitest (unit/integration) and Playwright (e2e)
- Tooling: ESLint (next + prettier config), Prettier (+ tailwind plugin), `tsx` for scripts

### Do NOT use

Pages Router, NextAuth, Redux, Zustand, Express, MongoDB.

## Folder structure

```
src/app/(public)/      landing, services (in (list) group so [id] has no loading.tsx and 404s properly), services/[id]
src/app/(auth)/        login, register, admin/login
src/app/(customer)/    dashboard, my-bookings, profile
src/app/admin/         dashboard, services, bookings, users
src/app/api/           route handlers
src/components/ui/     shadcn/ui primitives (generated; edit sparingly)
src/components/layout/ header, footer, nav, shells
src/components/auth/   auth card, login/register forms, form field
src/components/profile/ profile and change-password forms
src/components/admin/  sidebar/topbar, URL-synced filters, tables, dialogs, charts (recharts)
src/components/services/
src/components/bookings/
src/components/admin/
src/lib/prisma.ts      Prisma client singleton
src/lib/auth.ts        hashing, session cookie, getSession, requireUser/requireAdmin (server only)
src/lib/jwt.ts         edge-safe signToken/verifyToken (used by middleware)
src/lib/services.ts    server data access for services/categories (listServices, getService, serializers)
src/lib/booking-rules.ts pure rules: status transitions, 30-min slots, Asia/Colombo "today"
src/lib/bookings.ts    server data access for bookings (list, create in a transaction, dashboards)
src/lib/admin.ts       server data access for admin stats and customer management
src/lib/format.ts      formatPrice ("LKR 4,500.00"), formatDuration
src/lib/api-client.ts  client fetch helper that throws ApiClientError
src/lib/validators.ts  zod schemas (shared client + server)
src/lib/api-response.ts success/error helpers, parseBody(request, schema)
src/middleware.ts      route protection (customer pages, /admin, guest-only pages)
prisma/                schema.prisma, migrations, seed.ts
tests/                 Vitest + Playwright
docs/                  project documentation
```

## Conventions

- **Server Components by default.** Add `"use client"` only for components that need interactivity (state, effects, event handlers, browser APIs). Keep client components small and leaf-level.
- **API errors** always return `{ error: { code, message } }` with the correct HTTP status (400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 500 unexpected). Use helpers from `src/lib/api-response.ts`; never leak stack traces or Prisma errors.
- **Every API input is validated with zod** (body, params and query) before touching the database. The same schema drives the client form.
- **Every admin endpoint checks `role === ADMIN`** on the server (never trust the client or the UI).
- **Customers can only access their own bookings**: always scope queries by the session `userId`; return 404 for others' records.
- Inactive users (`isActive = false`) cannot log in. `INACTIVE` services are hidden from the public catalogue and cannot be booked.
- **Every data view has loading, empty and error states** (`loading.tsx` / skeletons, a friendly empty message with a call to action, `error.tsx` or inline error with retry).
- **Every destructive action uses a confirmation dialog** (shadcn `AlertDialog`).
- Money is `Decimal(10,2)` in the DB, displayed as `LKR 4,500.00` via `formatPrice` from `src/lib/format.ts`. Serialize Decimals to strings/numbers before passing to client components.
- `bookingDate` is a date-only column; `bookingTime` is a `"HH:mm"` 24h string.
- Feedback for mutations uses sonner toasts.
- Page titles on public/customer pages use `<PageHeader>` (one `<h1>` per page; headings never skip a level). Admin pages get their `<h1>` from the top bar.
- Controls: `<Button>` and `<Input>` default to 40px (`h-10`); native `<select>` uses `nativeSelectClass`; destructive actions use `variant="destructive"` (solid red) inside a confirm dialog.
- Contrast: never put `text-muted-foreground` on `bg-muted` (fails AA); status colors come from `STATUS_STYLES`.
- Wide tables go in `<TableShell>` (horizontal scroll); inside CSS grids give the cell `min-w-0`.
- `loading.tsx` only on list pages (use a route group like `services/(list)`), never above a `[id]` page that calls `notFound()`: streaming would turn the 404 into a 200.
- Public routes that show admins extra data use `isAdminViewer()` (DB-checked), not the token role.
- Security headers live in `next.config.ts`. Remote service images render with `unoptimized`; don't add a wildcard `images.remotePatterns` (open image proxy).
- Admin pages are Server Components that read via `src/lib/*`; client tables mutate through the API and call `router.refresh()`. Filters live in the URL (`AdminFilters`); bad params fall back to defaults via `parseSearchParams`.
- Page guards: `requirePageUser()` / `requirePageAdmin()`. If the token is valid but the account is gone or inactive, they redirect through `GET /api/auth/logout?next=...` to clear the cookie (avoids a middleware redirect loop).
- Links styled as buttons use `<Link className={buttonVariants(...)}>`, not `<Button render={<Link/>}>` (that renders `role="button"` on an anchor).
- Server Components query Prisma through `src/lib/*` data functions; route handlers reuse the same functions.
- No `any`; no unused code; no TODOs in committed code.

## Design tokens

| Token         | Value     | Tailwind usage                  |
| ------------- | --------- | ------------------------------- |
| primary       | `#0F766E` | `bg-primary`, `text-primary`    |
| primary-hover | `#115E59` | `hover:bg-primary-hover`        |
| ink           | `#0F172A` | `text-ink` / `text-foreground`  |
| muted         | `#64748B` | `text-muted-foreground`         |
| surface       | `#FFFFFF` | `bg-surface` / `bg-card`        |
| background    | `#F8FAFC` | `bg-background`                 |
| border        | `#E2E8F0` | `border-border`                 |
| accent        | `#F59E0B` | `bg-warning`, `text-warning`    |
| danger        | `#DC2626` | `bg-destructive`, `text-danger` |

- Font: **Plus Jakarta Sans** via `next/font/google` (CSS var `--font-jakarta`, wired to `font-sans`).
- Radius: **10px on cards** (`rounded-card`), **8px on inputs and buttons** (`rounded-control`).
- Mobile-first. Breakpoints: `sm` 640, `md` 768, `lg` 1024 (Tailwind defaults).
- Tokens live in `src/app/globals.css`; never hardcode hex values in components.

## Booking status rules

- A new booking is always created as `PENDING`, with `totalPrice` snapshotted from the service price.
- A customer may cancel **their own** booking only when it is `PENDING` or `CONFIRMED`.
- Only an admin may set `CONFIRMED` or `COMPLETED`.
- `COMPLETED` and `CANCELLED` are final: no further transitions.
- Transition logic lives only in `checkTransition()` in `src/lib/booking-rules.ts`; invalid transitions return **422**.
- Slots are 30-minute start times from 08:00 to 18:00 inclusive. "Today" and "now" are Asia/Colombo time.
- A slot is taken by any non-`CANCELLED` booking for the same service, date and time; the check and insert run in one serializable transaction (409 "This time slot is already booked").

Allowed transitions:

| From      | To        | Who            |
| --------- | --------- | -------------- |
| PENDING   | CONFIRMED | admin          |
| PENDING   | CANCELLED | owner or admin |
| CONFIRMED | COMPLETED | admin          |
| CONFIRMED | CANCELLED | owner or admin |

## Commands

```
npm run dev          # start dev server
npm run db:migrate   # prisma migrate dev
npm run db:seed      # run prisma/seed.ts
npm run db:reset     # drop, re-migrate and re-seed
npm run db:studio    # Prisma Studio
npm run lint         # ESLint
npm run format       # Prettier
npm run typecheck    # tsc --noEmit
npm run test:unit    # unit tests (no database; what CI runs)
npm test             # unit + API integration tests (needs TEST_DATABASE_URL)
npm run test:e2e     # Playwright E2E on :3100 (needs TEST_DATABASE_URL)
npm run test:all     # everything
```

Seed accounts: `admin@servicehub.com` / `Admin@123`; customers `nimali@example.com`, `kasun@example.com`, `tharushi@example.com` / `Customer@123`.

## Testing

- Unit tests in `tests/unit`, API integration tests in `tests/api` (call route handlers directly; `loginAs()` from `tests/api/helpers.ts`), E2E in `tests/e2e`. See `docs/TESTING_REPORT.md`.
- API and E2E runs re-seed the database at `TEST_DATABASE_URL`, which must be a separate, disposable database (the setup refuses to run against `DATABASE_URL`).
- New business rules get a unit test; new API routes get integration tests for auth (401/403), ownership (404) and validation (400).

## Git

Conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:` (also `refactor:`, `style:` when appropriate).

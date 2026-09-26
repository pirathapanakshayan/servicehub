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
src/components/admin/  admin theme: top bar + pill nav, panels, filter bar, pill tabs, tables, dialogs, charts
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
- Controls: `<Button>` and `<Input>` default to 40px (`h-10`) pills; native selects use `<Select>` (or `nativeSelectClass`); destructive actions use `variant="destructive"` inside a confirm dialog.
- Contrast: never put `text-muted-foreground` on `bg-muted`/`--surface-2` (4.14:1, fails AA). Booking status is shown with `StatusPill` (`src/components/ui/status-pill.tsx`).
- Wide tables go in `<TableShell>` (horizontal scroll); inside CSS grids give the cell `min-w-0`.
- `loading.tsx` only on list pages (use a route group like `services/(list)`), never above a `[id]` page that calls `notFound()`: streaming would turn the 404 into a 200.
- Public routes that show admins extra data use `isAdminViewer()` (DB-checked), not the token role.
- Security headers live in `next.config.ts`. Remote service images render with `unoptimized`; don't add a wildcard `images.remotePatterns` (open image proxy).
- Admin pages are Server Components that read via `src/lib/*`; client tables mutate through the API and call `router.refresh()`. Filters live in the URL (`AdminFilters`); bad params fall back to defaults via `parseSearchParams`.
- Page guards: `requirePageUser()` / `requirePageAdmin()`. If the token is valid but the account is gone or inactive, they redirect through `GET /api/auth/logout?next=...` to clear the cookie (avoids a middleware redirect loop).
- Links styled as buttons use `<Link className={buttonVariants(...)}>`, not `<Button render={<Link/>}>` (that renders `role="button"` on an anchor).
- Server Components query Prisma through `src/lib/*` data functions; route handlers reuse the same functions.
- No `any`; no unused code; no TODOs in committed code.

## Brand

One brand for the site and the admin panel: dark, charcoal surfaces with a single lime accent. Tokens live in `src/app/globals.css`; never hardcode hex values in components.

The palette is namespaced `--brand-*` because shadcn already uses `--muted`, `--accent` and `--border` with other meanings. The shadcn tokens (`--background`, `--card`, `--primary`, `--muted-foreground`, `--border`, `--input`, `--ring`...) are mapped onto it in `:root`, so shared components follow the brand.

| Spec name        | Token                                            | Value                                         | Tailwind                                      |
| ---------------- | ------------------------------------------------ | --------------------------------------------- | --------------------------------------------- |
| bg               | `--brand-bg`                                     | `#0B0C0F`                                     | `bg-background` (page body)                   |
| surface          | `--brand-surface`                                | `#16181C`                                     | `bg-card`, `bg-surface`                       |
| surface-2        | `--brand-surface-2`                              | `#1F2228`                                     | `bg-secondary`, `bg-muted`, `bg-surface-2`    |
| border           | `--brand-hairline`                               | `rgba(255,255,255,0.08)`                      | `border-border`                               |
| text             | `--brand-text`                                   | `#F4F5F7`                                     | `text-foreground`, `text-ink`                 |
| muted            | `--brand-muted`                                  | `#8A8F98`                                     | `text-muted-foreground`                       |
| accent           | `--brand-accent`                                 | `#C5F82A`                                     | `bg-primary`                                  |
| accent-ink       | `--brand-accent-ink`                             | `#0E0F12`                                     | `text-primary-foreground`                     |
| light            | `--brand-light`                                  | `#FFFFFF`                                     | `bg-light`                                    |
| light-text       | `--brand-light-text`                             | `#15171B`                                     | `text-light-text`                             |
| light-muted      | `--brand-light-muted`                            | `#6B7280`                                     | `text-light-muted`                            |
| danger / warning | `--brand-danger` / `--brand-warning`             | `#FF5A5F` / `#F5B544`                         | `bg-destructive`, `text-danger`, `bg-warning` |
| status           | `--status-pending/confirmed/completed/cancelled` | `#F5B544` / `#5AA9FF` / `#C5F82A` / `#8A8F98` | `StatusPill`                                  |

- **Fonts** (`next/font`): Plus Jakarta Sans for everything (`font-sans`). Instrument Serif italic (`font-serif`) only for one accent word inside a big heading, via `<SerifAccent>`: "Book trusted services in <SerifAccent>minutes</SerifAccent>".
- **Type scale**: `text-display` clamp(2.8rem, 7vw, 5.5rem) / 500 / -0.03em; `text-h1` 44px; `text-h2` 32px; `text-h3` 20px; body 16px; small `text-sm` 14px; labels `text-label` 13px muted (the `<Label>` default).
- **Radius**: sections 32px (`rounded-section`), cards 24px (`rounded-card`), inputs and buttons are pills (`rounded-control` = 999px). Textareas use 24px (a pill can't hold multiple lines).
- **Depth**: no borders except `--border` hairlines. Surfaces separate by fill contrast plus a top highlight, `shadow-surface` (inset 0 1px 0 rgba(255,255,255,0.04)).
- **Lime** is only ever a background with dark text, never text on white (1.25:1). On dark surfaces lime icons and accents are fine.
- **White surfaces**: wrap them in `.light-surface` (`LightPanel` does this). Tokens flip to light, focus rings turn dark and status pills switch to dark text.
- **Buttons**: `primary` (lime pill, dark text; pass `arrow` for the arrow that nudges right on hover, or put `<ButtonArrow />` inside a `buttonVariants()` link), `secondary` (white pill), `ghost` (surface pill), `icon` (circular; with `size="icon"`), plus `outline`, `destructive`, `link`. Destructive text is dark on `#FF5A5F` (white would be 3.05:1).
- **Shared components**: `LightPanel`, `StatusPill`/`ActivePill`, `PillTabs` (sliding lime indicator; build hrefs with `tabHref` from `src/lib/url.ts`), `SectionHeader` (lime-dot eyebrow, title, action), `SerifAccent`, `Select`, all in `src/components/ui`. The admin reuses them.
- **Layout**: floating pill navbar (`NavShell`: 16px from top, max-width 1200px, blurred `bg-card/70`, shrinks and gains a shadow after 24px of scroll), full-height mobile sheet, and a dark footer with 32px top corners and a clipped wordmark. Page body is `--brand-bg`.
- **Motion**: short and functional (150–200ms): arrow nudge, navbar shrink, tab indicator slide. Everything respects `prefers-reduced-motion` (`motion-reduce:transition-none`).

## Admin theme

`/admin` has its own dark theme built on the Brand tokens: admin text, muted, lime, ink, light colors, border and the canvas (`--admin-bg` = `--brand-surface`) reference `--brand-*`; only the frame and panel colors are admin-specific. Variables are scoped under `.admin-theme` on the admin layout root (`src/app/admin/layout.tsx`) and also on `body:has(.admin-theme)`, so portaled dialogs, sheets, menus and toasts pick them up. Public, auth and customer pages never see them. Inside `.admin-theme` the shared tokens (`--primary`, `--card`, `--brand-ink`...) are remapped, so shared components theme automatically.

| Token                                                          | Value                                                                                              | Use                               |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------- |
| `--admin-frame`                                                | `#0E0F12`                                                                                          | page background around the canvas |
| `--admin-bg`                                                   | `#16181C`                                                                                          | main canvas (radius 28px)         |
| `--admin-panel` / `--admin-panel-2`                            | `#22252B` / `#2B2F36`                                                                              | dark panels / raised items        |
| `--admin-border`                                               | `rgba(255,255,255,0.08)`                                                                           | panel borders                     |
| `--admin-text` / `--admin-muted`                               | `#F4F5F7` / `#8A8F98`                                                                              | text on dark                      |
| `--admin-accent` / `--admin-accent-ink`                        | `#C5F82A` / `#0E0F12`                                                                              | lime background / text on lime    |
| `--admin-light` / `--admin-light-text` / `--admin-light-muted` | `#FFFFFF` / `#15171B` / `#6B7280`                                                                  | white panels                      |
| Status                                                         | PENDING `#F5B544`, CONFIRMED `#5AA9FF`, COMPLETED `#C5F82A`, CANCELLED `#8A8F98`, danger `#FF5A5F` | `--status-*`, `--admin-danger`    |

- Radius: canvas 28px (`rounded-canvas`), panels 24px (`rounded-panel`), inner cards 18px (`rounded-inner`), pills `rounded-full`.
- Type: Plus Jakarta Sans. Page title 44px / 400 / -0.02em (32px on mobile); stat numbers 30px / 500; labels 13px muted.
- Utilities: `bg-admin-panel`, `text-admin-muted`, `bg-admin-accent text-admin-accent-ink`, etc. No hex values in components.
- White surfaces use `.light-surface` (`LightPanel`, `TableShell`, the pill nav): tokens flip back to light and focus rings turn dark.
- Contrast rules (measured): lime is **only** a background with dark text, never text on white (1.25:1). Status colors are text only on dark panels; on white, `StatusPill` shows dark text with a colored dot/border. Muted text never sits on `--admin-panel-2` (4.14:1). Danger buttons use dark text on `#FF5A5F` (`--destructive-foreground`).
- Focus: 2px outline in `--ring` (lime on dark, dark inside `.light-surface`).
- Admin components (`src/components/admin/`): `Panel`, `StatCard`, `FilterBar`, `InitialsAvatar` / `AvatarStack` (no remote photos), `PageActions` (renders into the title row's action slot). Shared ones (`LightPanel`, `PillTabs`, `StatusPill`) live in `src/components/ui`.

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

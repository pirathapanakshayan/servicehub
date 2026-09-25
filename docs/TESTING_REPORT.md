# ServiceHub testing report

Last run: 25 Sep 2026. **127 automated tests, 127 passed, 0 failed, 0 flaky.**

| Suite           | Tool            | Files                  | Tests | Result                       |
| --------------- | --------------- | ---------------------- | ----- | ---------------------------- |
| Unit            | Vitest 3.2      | `tests/unit/*.test.ts` | 102   | 102 passed                   |
| API integration | Vitest 3.2      | `tests/api/*.test.ts`  | 23    | 23 passed                    |
| End-to-end      | Playwright 1.63 | `tests/e2e/*.spec.ts`  | 2     | 2 passed (run twice, stable) |

## 1. Tools

| Tool               | Used for                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Vitest 3**       | Unit tests (pure functions, zod schemas) and API integration tests. Two Vitest projects: `unit` (no database) and `api` (test database). |
| **Playwright**     | End-to-end tests in a real browser against `next dev` on port 3100.                                                                      |
| **Prisma**         | `prisma db push` + `prisma/seed.ts` reset the test database before each API and E2E run.                                                 |
| **GitHub Actions** | `.github/workflows/ci.yml`: lint, Prettier check, type check and unit tests on every push and pull request.                              |

### How the API tests call route handlers

The tests import the route handler functions (e.g. `POST` from `src/app/api/bookings/route.ts`) and call them with a standard `Request`, so validation, auth, the error shape and the database are all exercised without an HTTP server. Two small shims make that work outside Next.js:

- `next/headers` is mocked (`tests/setup/api-mocks.ts`) so `cookies()` reads a test cookie jar. `loginAs(email)` in `tests/api/helpers.ts` signs a real session JWT for a seeded user and puts it in the jar.
- The `server-only` import is aliased to an empty module (`vitest.config.ts`); Next.js does the same on the server.

## 2. How to run

### One-time setup

1. Create a **separate, disposable** Postgres database for tests (for example a second Neon database or branch) and add it to `.env`:

   ```
   TEST_DATABASE_URL="postgresql://USER:PASSWORD@HOST/servicehub_test?sslmode=require"
   ```

   Every API/E2E run re-seeds this database, and `prisma/seed.ts` **deletes all rows** first. The setup (`tests/setup/reset-db.ts`) refuses to run if `TEST_DATABASE_URL` is missing or equals `DATABASE_URL`.

2. Install the Playwright browser (about 200 MB):

   ```
   npx playwright install chromium
   ```

   If that download isn't possible, use an installed browser instead: `PLAYWRIGHT_CHANNEL=msedge` (or `chrome`).

### Commands

| Command              | Runs                                                | Needs a test DB |
| -------------------- | --------------------------------------------------- | --------------- |
| `npm test`           | All Vitest tests (unit + API)                       | Yes             |
| `npm run test:unit`  | Unit tests only (what CI runs)                      | No              |
| `npm run test:api`   | API integration tests only                          | Yes             |
| `npm run test:watch` | Unit tests in watch mode                            | No              |
| `npm run test:e2e`   | Playwright E2E (starts its own dev server on :3100) | Yes             |
| `npm run test:all`   | `vitest run` then `playwright test`                 | Yes             |

Playwright writes an HTML report to `playwright-report/` (`npx playwright show-report`) and keeps a trace and screenshot for any failure in `test-results/`.

### Safety and isolation

- The E2E dev server runs on port 3100 with `reuseExistingServer: false`, so it can never attach to a dev server that is using the real database.
- API and E2E runs share one database, so test files run one at a time (`fileParallelism: false`, Playwright `workers: 1`).
- The API tests use a fixed test-only `JWT_SECRET`; no real secret is needed.

## 3. Environment used for this run

| Item          | Value                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| OS            | Windows 11                                                                                                                           |
| Node          | 24.15 (CI uses Node 22)                                                                                                              |
| Test database | PGlite 0.5.8 (in-memory PostgreSQL 18.3 over the wire protocol) on `127.0.0.1:55433`, connected through Prisma with `pgbouncer=true` |
| E2E browser   | Microsoft Edge (Chromium) via `PLAYWRIGHT_CHANNEL=msedge`, "Desktop Chrome" device profile (1280×720)                                |

Two things were **not** exercised in this run: a real Neon database (no connection string was available), and the GitHub Actions workflow itself (the project isn't a git repository yet). The workflow's steps were run locally in order (`npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:unit` with no test database configured) and all passed. The bundled Playwright Chromium download was too slow on this connection (10% after 9 minutes), so the E2E run used the installed Edge, which is also Chromium-based.

## 4. Issues found while writing the tests

| Finding                                                                                                         | Fix                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bookingCreateSchema` accepted past dates; only the service layer rejected them.                                | The schema now rejects a date/time that isn't in the future (`isFutureSlot`), so client and API share the rule. The server-side check stays as a backstop. |
| Prisma refuses `db push --force-reset` when run by an AI agent without explicit user consent.                   | The reset uses a plain `prisma db push` (never drops the schema) followed by the seed, which already clears every table. Nothing was forced.               |
| E2E: the "Booking requested" toast could expire before the first dev-mode compile of the booking page finished. | The test checks the toast before waiting for the redirect.                                                                                                 |
| E2E: after marking a booking completed, the row correctly leaves a list filtered to `CONFIRMED`.                | The test now verifies the completed booking under the `COMPLETED` filter.                                                                                  |

The last two were test-design mistakes; the app behaved correctly in both.

## 5. Test cases

"Expected result" is what the test asserts; "Actual" is the result from the run above (generated from the Vitest and Playwright JSON reporters).

### Requirement coverage

| Required case                                                     | Test (#)                                       | Actual |
| ----------------------------------------------------------------- | ---------------------------------------------- | ------ |
| Every allowed and forbidden status transition, CUSTOMER and ADMIN | booking-rules matrix, 32 combinations (#2–#33) | Pass   |
| Validators: register                                              | #62–#72                                        | Pass   |
| Validators: booking past date, bad time format                    | #74 (past date), #75–#81 (bad times)           | Pass   |
| Validators: service                                               | #86–#97                                        | Pass   |
| Register duplicate email → 409                                    | #104                                           | Pass   |
| Login wrong password → 401                                        | #106                                           | Pass   |
| Booking past date → 400                                           | #112                                           | Pass   |
| Booking taken slot → 409                                          | #113                                           | Pass   |
| Customer cancels own PENDING booking → 200                        | #115                                           | Pass   |
| Customer cancels COMPLETED booking → 422                          | #116                                           | Pass   |
| Customer reads another user's booking → 404                       | #119                                           | Pass   |
| Customer `POST /api/services` → 403                               | #122                                           | Pass   |
| Admin deletes service with bookings → 409                         | #124                                           | Pass   |
| E2E customer: register, browse, book, see in My Bookings, cancel  | #127                                           | Pass   |
| E2E admin: login, confirm pending booking, mark completed         | #126                                           | Pass   |

### All test cases

#### `tests/unit/booking-rules.test.ts` (61 tests)

| #   | Group                                        | Test case                                                 | Expected result                                                                | Actual |
| --- | -------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ | ------ |
| 1   | checkTransition: full status matrix          | covers all 32 actor/from/to combinations                  | Covers all 32 actor/from/to combinations                                       | Pass   |
| 2   | checkTransition: full status matrix          | CUSTOMER: PENDING -> PENDING is allowed=false             | Rejected with an error message                                                 | Pass   |
| 3   | checkTransition: full status matrix          | CUSTOMER: PENDING -> CONFIRMED is allowed=false           | Rejected with an error message                                                 | Pass   |
| 4   | checkTransition: full status matrix          | CUSTOMER: PENDING -> COMPLETED is allowed=false           | Rejected with an error message                                                 | Pass   |
| 5   | checkTransition: full status matrix          | CUSTOMER: PENDING -> CANCELLED is allowed=true            | Allowed (`ok: true`)                                                           | Pass   |
| 6   | checkTransition: full status matrix          | CUSTOMER: CONFIRMED -> PENDING is allowed=false           | Rejected with an error message                                                 | Pass   |
| 7   | checkTransition: full status matrix          | CUSTOMER: CONFIRMED -> CONFIRMED is allowed=false         | Rejected with an error message                                                 | Pass   |
| 8   | checkTransition: full status matrix          | CUSTOMER: CONFIRMED -> COMPLETED is allowed=false         | Rejected with an error message                                                 | Pass   |
| 9   | checkTransition: full status matrix          | CUSTOMER: CONFIRMED -> CANCELLED is allowed=true          | Allowed (`ok: true`)                                                           | Pass   |
| 10  | checkTransition: full status matrix          | CUSTOMER: COMPLETED -> PENDING is allowed=false           | Rejected with an error message                                                 | Pass   |
| 11  | checkTransition: full status matrix          | CUSTOMER: COMPLETED -> CONFIRMED is allowed=false         | Rejected with an error message                                                 | Pass   |
| 12  | checkTransition: full status matrix          | CUSTOMER: COMPLETED -> COMPLETED is allowed=false         | Rejected with an error message                                                 | Pass   |
| 13  | checkTransition: full status matrix          | CUSTOMER: COMPLETED -> CANCELLED is allowed=false         | Rejected with an error message                                                 | Pass   |
| 14  | checkTransition: full status matrix          | CUSTOMER: CANCELLED -> PENDING is allowed=false           | Rejected with an error message                                                 | Pass   |
| 15  | checkTransition: full status matrix          | CUSTOMER: CANCELLED -> CONFIRMED is allowed=false         | Rejected with an error message                                                 | Pass   |
| 16  | checkTransition: full status matrix          | CUSTOMER: CANCELLED -> COMPLETED is allowed=false         | Rejected with an error message                                                 | Pass   |
| 17  | checkTransition: full status matrix          | CUSTOMER: CANCELLED -> CANCELLED is allowed=false         | Rejected with an error message                                                 | Pass   |
| 18  | checkTransition: full status matrix          | ADMIN: PENDING -> PENDING is allowed=false                | Rejected with an error message                                                 | Pass   |
| 19  | checkTransition: full status matrix          | ADMIN: PENDING -> CONFIRMED is allowed=true               | Allowed (`ok: true`)                                                           | Pass   |
| 20  | checkTransition: full status matrix          | ADMIN: PENDING -> COMPLETED is allowed=false              | Rejected with an error message                                                 | Pass   |
| 21  | checkTransition: full status matrix          | ADMIN: PENDING -> CANCELLED is allowed=true               | Allowed (`ok: true`)                                                           | Pass   |
| 22  | checkTransition: full status matrix          | ADMIN: CONFIRMED -> PENDING is allowed=false              | Rejected with an error message                                                 | Pass   |
| 23  | checkTransition: full status matrix          | ADMIN: CONFIRMED -> CONFIRMED is allowed=false            | Rejected with an error message                                                 | Pass   |
| 24  | checkTransition: full status matrix          | ADMIN: CONFIRMED -> COMPLETED is allowed=true             | Allowed (`ok: true`)                                                           | Pass   |
| 25  | checkTransition: full status matrix          | ADMIN: CONFIRMED -> CANCELLED is allowed=true             | Allowed (`ok: true`)                                                           | Pass   |
| 26  | checkTransition: full status matrix          | ADMIN: COMPLETED -> PENDING is allowed=false              | Rejected with an error message                                                 | Pass   |
| 27  | checkTransition: full status matrix          | ADMIN: COMPLETED -> CONFIRMED is allowed=false            | Rejected with an error message                                                 | Pass   |
| 28  | checkTransition: full status matrix          | ADMIN: COMPLETED -> COMPLETED is allowed=false            | Rejected with an error message                                                 | Pass   |
| 29  | checkTransition: full status matrix          | ADMIN: COMPLETED -> CANCELLED is allowed=false            | Rejected with an error message                                                 | Pass   |
| 30  | checkTransition: full status matrix          | ADMIN: CANCELLED -> PENDING is allowed=false              | Rejected with an error message                                                 | Pass   |
| 31  | checkTransition: full status matrix          | ADMIN: CANCELLED -> CONFIRMED is allowed=false            | Rejected with an error message                                                 | Pass   |
| 32  | checkTransition: full status matrix          | ADMIN: CANCELLED -> COMPLETED is allowed=false            | Rejected with an error message                                                 | Pass   |
| 33  | checkTransition: full status matrix          | ADMIN: CANCELLED -> CANCELLED is allowed=false            | Rejected with an error message                                                 | Pass   |
| 34  | checkTransition: error messages              | explains that COMPLETED and CANCELLED are final           | Explains that COMPLETED and CANCELLED are final                                | Pass   |
| 35  | checkTransition: error messages              | tells a customer they can only cancel                     | Tells a customer they can only cancel                                          | Pass   |
| 36  | checkTransition: error messages              | rejects skipping a step                                   | PENDING -> COMPLETED rejected: "Cannot change a pending booking to completed." | Pass   |
| 37  | nextStatuses / canCustomerCancel             | offers admins only valid next statuses                    | Offers admins only valid next statuses                                         | Pass   |
| 38  | nextStatuses / canCustomerCancel             | lets customers cancel only PENDING or CONFIRMED           | Lets customers cancel only PENDING or CONFIRMED                                | Pass   |
| 39  | time slots                                   | are every 30 minutes from 08:00 to 18:00 inclusive        | Are every 30 minutes from 08:00 to 18:00 inclusive                             | Pass   |
| 40  | time slots                                   | accepts 08:00                                             | Returns `true`                                                                 | Pass   |
| 41  | time slots                                   | accepts 12:30                                             | Returns `true`                                                                 | Pass   |
| 42  | time slots                                   | accepts 18:00                                             | Returns `true`                                                                 | Pass   |
| 43  | time slots                                   | rejects "07:30"                                           | Returns `false`                                                                | Pass   |
| 44  | time slots                                   | rejects "18:30"                                           | Returns `false`                                                                | Pass   |
| 45  | time slots                                   | rejects "10:15"                                           | Returns `false`                                                                | Pass   |
| 46  | time slots                                   | rejects "9:00"                                            | Returns `false`                                                                | Pass   |
| 47  | time slots                                   | rejects "25:00"                                           | Returns `false`                                                                | Pass   |
| 48  | time slots                                   | rejects "noon"                                            | Returns `false`                                                                | Pass   |
| 49  | time slots                                   | rejects ""                                                | Returns `false`                                                                | Pass   |
| 50  | business time zone (Asia/Colombo, UTC+05:30) | reports the local date and time                           | Reports the local date and time                                                | Pass   |
| 51  | business time zone (Asia/Colombo, UTC+05:30) | rolls over the date before UTC does                       | Rolls over the date before UTC does                                            | Pass   |
| 52  | business time zone (Asia/Colombo, UTC+05:30) | treats only later times today, and later dates, as future | Treats only later times today, and later dates, as future                      | Pass   |
| 53  | business time zone (Asia/Colombo, UTC+05:30) | hides taken and past slots                                | Hides taken and past slots                                                     | Pass   |
| 54  | isValidDateOnly                              | accepts 2026-01-31                                        | Returns `true`                                                                 | Pass   |
| 55  | isValidDateOnly                              | accepts 2028-02-29                                        | Returns `true`                                                                 | Pass   |
| 56  | isValidDateOnly                              | rejects "2026-02-30"                                      | Returns `false`                                                                | Pass   |
| 57  | isValidDateOnly                              | rejects "2027-02-29"                                      | Returns `false`                                                                | Pass   |
| 58  | isValidDateOnly                              | rejects "2026-13-01"                                      | Returns `false`                                                                | Pass   |
| 59  | isValidDateOnly                              | rejects "26-01-01"                                        | Returns `false`                                                                | Pass   |
| 60  | isValidDateOnly                              | rejects "2026/01/01"                                      | Returns `false`                                                                | Pass   |
| 61  | isValidDateOnly                              | rejects ""                                                | Returns `false`                                                                | Pass   |

#### `tests/unit/validators.test.ts` (41 tests)

| #   | Group               | Test case                                                                        | Expected result                           | Actual |
| --- | ------------------- | -------------------------------------------------------------------------------- | ----------------------------------------- | ------ |
| 62  | registerSchema      | accepts valid input and normalizes the email                                     | Accepted                                  | Pass   |
| 63  | registerSchema      | strips a role from the body                                                      | Strips a role from the body               | Pass   |
| 64  | registerSchema      | rejects {"name":"A"}                                                             | Rejected with the expected field error    | Pass   |
| 65  | registerSchema      | rejects {"name":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"} | Rejected with the expected field error    | Pass   |
| 66  | registerSchema      | rejects {"email":"not-an-email"}                                                 | Rejected with the expected field error    | Pass   |
| 67  | registerSchema      | rejects {"password":"short1","confirmPassword":"short1"}                         | Rejected with the expected field error    | Pass   |
| 68  | registerSchema      | rejects {"password":"abcdefgh","confirmPassword":"abcdefgh"}                     | Rejected with the expected field error    | Pass   |
| 69  | registerSchema      | rejects {"password":"12345678","confirmPassword":"12345678"}                     | Rejected with the expected field error    | Pass   |
| 70  | registerSchema      | rejects {"confirmPassword":"different1"}                                         | Rejected with the expected field error    | Pass   |
| 71  | registerSchema      | rejects {"phone":"abc"}                                                          | Rejected with the expected field error    | Pass   |
| 72  | registerSchema      | allows an empty optional phone                                                   | Allows an empty optional phone            | Pass   |
| 73  | bookingCreateSchema | accepts a future slot and turns empty notes into null                            | Accepted                                  | Pass   |
| 74  | bookingCreateSchema | rejects a past date                                                              | Rejected with the expected field error    | Pass   |
| 75  | bookingCreateSchema | rejects bad time "9:00"                                                          | Rejected with the time error              | Pass   |
| 76  | bookingCreateSchema | rejects bad time "10:15"                                                         | Rejected with the time error              | Pass   |
| 77  | bookingCreateSchema | rejects bad time "25:00"                                                         | Rejected with the time error              | Pass   |
| 78  | bookingCreateSchema | rejects bad time "10.30"                                                         | Rejected with the time error              | Pass   |
| 79  | bookingCreateSchema | rejects bad time "18:30"                                                         | Rejected with the time error              | Pass   |
| 80  | bookingCreateSchema | rejects bad time "07:30"                                                         | Rejected with the time error              | Pass   |
| 81  | bookingCreateSchema | rejects bad time ""                                                              | Rejected with the time error              | Pass   |
| 82  | bookingCreateSchema | rejects bad date "2026-02-30"                                                    | Rejected with the date error              | Pass   |
| 83  | bookingCreateSchema | rejects bad date "25-10-2026"                                                    | Rejected with the date error              | Pass   |
| 84  | bookingCreateSchema | rejects bad date "tomorrow"                                                      | Rejected with the date error              | Pass   |
| 85  | bookingCreateSchema | rejects notes over 500 characters and a non-uuid service                         | Rejected with the expected field error    | Pass   |
| 86  | serviceSchema       | coerces form strings and applies defaults                                        | Coerces form strings and applies defaults | Pass   |
| 87  | serviceSchema       | rejects {"name":"ab"}                                                            | Rejected with the expected field error    | Pass   |
| 88  | serviceSchema       | rejects {"description":"too short"}                                              | Rejected with the expected field error    | Pass   |
| 89  | serviceSchema       | rejects {"price":"-1"}                                                           | Rejected with the expected field error    | Pass   |
| 90  | serviceSchema       | rejects {"price":"10.005"}                                                       | Rejected with the expected field error    | Pass   |
| 91  | serviceSchema       | rejects {"durationMinutes":"10"}                                                 | Rejected with the expected field error    | Pass   |
| 92  | serviceSchema       | rejects {"durationMinutes":"481"}                                                | Rejected with the expected field error    | Pass   |
| 93  | serviceSchema       | rejects {"durationMinutes":"30.5"}                                               | Rejected with the expected field error    | Pass   |
| 94  | serviceSchema       | rejects {"categoryId":"cleaning"}                                                | Rejected with the expected field error    | Pass   |
| 95  | serviceSchema       | rejects {"imageUrl":"javascript:alert(1)"}                                       | Rejected with the expected field error    | Pass   |
| 96  | serviceSchema       | rejects {"status":"ARCHIVED"}                                                    | Rejected with the expected field error    | Pass   |
| 97  | serviceSchema       | allows price 0                                                                   | Allows price 0                            | Pass   |
| 98  | safeRedirectPath    | "/my-bookings" -> "/my-bookings"                                                 | Returns "/my-bookings"                    | Pass   |
| 99  | safeRedirectPath    | "https://evil.example" -> "/dashboard"                                           | Returns "/dashboard"                      | Pass   |
| 100 | safeRedirectPath    | "//evil.example" -> "/dashboard"                                                 | Returns "/dashboard"                      | Pass   |
| 101 | safeRedirectPath    | "/\\evil.example" -> "/dashboard"                                                | Returns "/dashboard"                      | Pass   |
| 102 | safeRedirectPath    | null -> "/dashboard"                                                             | Returns "/dashboard"                      | Pass   |

#### `tests/api/auth.test.ts` (7 tests)

| #   | Group                   | Test case                                               | Expected result                                         | Actual |
| --- | ----------------------- | ------------------------------------------------------- | ------------------------------------------------------- | ------ |
| 103 | POST /api/auth/register | creates a CUSTOMER and never returns the password hash  | Creates a CUSTOMER and never returns the password hash  | Pass   |
| 104 | POST /api/auth/register | returns 409 for a duplicate email (case-insensitive)    | Returns 409 for a duplicate email (case-insensitive)    | Pass   |
| 105 | POST /api/auth/register | returns 400 with field errors for invalid input         | Returns 400 with field errors for invalid input         | Pass   |
| 106 | POST /api/auth/login    | returns 401 with a generic message for a wrong password | Returns 401 with a generic message for a wrong password | Pass   |
| 107 | POST /api/auth/login    | returns the same 401 for an unknown email               | Returns the same 401 for an unknown email               | Pass   |
| 108 | POST /api/auth/login    | sets an httpOnly session cookie on success              | Sets an httpOnly session cookie on success              | Pass   |
| 109 | POST /api/auth/login    | returns 403 for a deactivated account                   | Returns 403 for a deactivated account                   | Pass   |

#### `tests/api/bookings.test.ts` (11 tests)

| #   | Group                 | Test case                                                    | Expected result                                              | Actual |
| --- | --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------ |
| 110 | POST /api/bookings    | returns 401 when not logged in                               | Returns 401 when not logged in                               | Pass   |
| 111 | POST /api/bookings    | creates a PENDING booking with the service price snapshotted | Creates a PENDING booking with the service price snapshotted | Pass   |
| 112 | POST /api/bookings    | returns 400 for a past date                                  | Returns 400 for a past date                                  | Pass   |
| 113 | POST /api/bookings    | returns 409 when the slot is already taken                   | Returns 409 when the slot is already taken                   | Pass   |
| 114 | POST /api/bookings    | returns 403 for an admin                                     | Returns 403 for an admin                                     | Pass   |
| 115 | PUT /api/bookings/:id | lets a customer cancel their own PENDING booking (200)       | Lets a customer cancel their own PENDING booking (200)       | Pass   |
| 116 | PUT /api/bookings/:id | returns 422 when a customer cancels a COMPLETED booking      | Returns 422 when a customer cancels a COMPLETED booking      | Pass   |
| 117 | PUT /api/bookings/:id | returns 403 when a customer tries to confirm                 | Returns 403 when a customer tries to confirm                 | Pass   |
| 118 | PUT /api/bookings/:id | returns 404 when a customer changes another user's booking   | Returns 404 when a customer changes another user's booking   | Pass   |
| 119 | GET /api/bookings/:id | returns 404 when a customer reads another user's booking     | Returns 404 when a customer reads another user's booking     | Pass   |
| 120 | GET /api/bookings/:id | returns the booking to its owner and to an admin             | Returns the booking to its owner and to an admin             | Pass   |

#### `tests/api/services.test.ts` (5 tests)

| #   | Group                    | Test case                                   | Expected result                             | Actual |
| --- | ------------------------ | ------------------------------------------- | ------------------------------------------- | ------ |
| 121 | POST /api/services       | returns 401 when not logged in              | Returns 401 when not logged in              | Pass   |
| 122 | POST /api/services       | returns 403 for a customer                  | Returns 403 for a customer                  | Pass   |
| 123 | POST /api/services       | creates the service for an admin            | Creates the service for an admin            | Pass   |
| 124 | DELETE /api/services/:id | returns 409 for a service that has bookings | Returns 409 for a service that has bookings | Pass   |
| 125 | DELETE /api/services/:id | deletes a service without bookings          | Deletes a service without bookings          | Pass   |

#### E2E (Playwright, 2 tests)

| #   | File               | Test case                                                               | Steps checked                                                                           | Actual       |
| --- | ------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------ |
| 126 | `admin.spec.ts`    | admin logs in, confirms a pending booking, then marks it completed      | confirm a pending booking → mark it completed → details sheet shows the new status      | Pass (28.4s) |
| 127 | `customer.spec.ts` | customer registers, books a slot, sees it in My Bookings and cancels it | register → browse and search services → book a slot → see it in My Bookings → cancel it | Pass (29.8s) |

## 6. Manual checks

These were done during the UI/accessibility audit (the step before the automated tests), in the Claude desktop app's built-in Chromium browser pane against the dev server with seeded data. That pane was hidden during the audit, so layout was **measured with scripts** (element bounds and scroll width), not judged from screenshots.

### Responsive widths

Every page was loaded at each width and checked for horizontal page overflow (any element extending past the viewport, excluding tables inside their intended scroll containers).

| Page                                                          | 375 px                         | 768 px                    | 1280 px                                                                                                                                                            |
| ------------------------------------------------------------- | ------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/` landing                                                   | OK                             | OK                        | OK                                                                                                                                                                 |
| `/services`                                                   | OK                             | OK                        | OK                                                                                                                                                                 |
| `/services/[id]` incl. booking form                           | OK                             | OK                        | OK                                                                                                                                                                 |
| `/login`, `/register`, `/admin/login`                         | OK                             | OK                        | not measured (fixed-width centered card)                                                                                                                           |
| `/dashboard`, `/my-bookings`, `/my-bookings/[id]`, `/profile` | OK                             | OK                        | OK                                                                                                                                                                 |
| 404 page                                                      | OK                             | not measured              | not measured                                                                                                                                                       |
| `/admin/dashboard`                                            | OK, tables scroll in card      | OK, tables scroll in card | **Failed, fixed**: page was ~115 px too wide (table stretched its grid column; donut legend overflowed). Fixed with `min-w-0` and a stacked legend, re-measured OK |
| `/admin/services`, `/admin/bookings`, `/admin/users`          | OK, tables scroll in card      | OK, tables scroll in card | OK                                                                                                                                                                 |
| Admin sidebar                                                 | Drawer with all links + Logout | Drawer                    | Fixed sidebar                                                                                                                                                      |

### Browsers

| Browser                            | How                                                                                                                     | Result |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| Microsoft Edge (Chromium)          | Playwright E2E, both flows                                                                                              | Pass   |
| Chromium (Claude app browser pane) | Manual flows during development and the audit                                                                           | Pass   |
| Firefox, Safari/WebKit             | **Not tested.** Add `firefox`/`webkit` projects in `playwright.config.ts` after `npx playwright install` to cover them. | n/a    |
| Mobile devices                     | **Not tested on real devices.** Mobile layout was checked by viewport emulation only (375 px, touch profile).           | n/a    |

### Accessibility

| Check                                                  | Method                                                                                                    | Result                                                                                                                                                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text contrast AA (4.5:1)                               | Computed WCAG ratios for every token pair in use                                                          | All pass after fixes (lowest: muted text on background 4.55:1). Three pairs failed before the audit and were fixed: muted-on-muted 4.34, red-on-red-tint buttons 4.13, input borders 1.23:1 |
| Non-text contrast (3:1) for inputs, switch, focus ring | Computed                                                                                                  | Pass (input border 3.03, switch track 4.76, focus ring 5.47)                                                                                                                                |
| One `<h1>` per page, no skipped levels                 | Script over every page at 375 px                                                                          | Pass (auth pages had no `<h1>`; fixed)                                                                                                                                                      |
| Labels on inputs, names on icon-only buttons           | Code review + accessibility tree queries                                                                  | Pass                                                                                                                                                                                        |
| Visible focus                                          | Global `:focus-visible` outline; table rows get an inset ring                                             | Pass (code review)                                                                                                                                                                          |
| Dialogs and menus                                      | Base UI primitives (focus trap, Escape to close); dialogs driven in E2E by role (`alertdialog`, `dialog`) | Pass for pointer and role-based use                                                                                                                                                         |
| Full keyboard-only walkthrough                         | **Not done**                                                                                              | Not verified                                                                                                                                                                                |
| Screen reader (NVDA/VoiceOver)                         | **Not done**                                                                                              | Not verified                                                                                                                                                                                |

## 7. Known gaps

- CI runs lint, format, type check and unit tests only (as requested). API and E2E tests need a disposable database, so they aren't in CI yet. Adding a Postgres service container to the workflow would let them run there.
- No tests against a real Neon database, and none of concurrent booking under real network latency (the API suite checks the 409 path; the serializable transaction was load-checked manually in an earlier step with 5 parallel requests: 1 succeeded, 4 got 409).
- No coverage thresholds or visual regression tests.

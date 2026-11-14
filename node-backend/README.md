# Expense API — Node / Express

JavaScript ES modules, Node 24, Express 5, PostgreSQL, Drizzle ORM and Zod. Drizzle reuses the existing `pg` connection pool and generates SQL migrations you can review. FastAPI remains a separate implementation.

## Start

From this directory, with PostgreSQL running and `.env` configured (see [root setup](../README.md)):

```sh
npm ci
npm run db:check
npm run db:migrate
npm run db:seed
npm run dev
```

The seed adds one demo owner and one expense, is development-only and safe to rerun. It never clears existing tables. `npm start` runs without nodemon; `npm run dev` watches `src/` and `.env` and supports `rs` for manual restart.

## Implemented endpoints

| Method / path | Behavior |
| --- | --- |
| `GET /health` | Database readiness; 200 or 503 |
| `GET /health/live` | Process liveness; 200 |
| `GET /health/ready` | Database readiness; 200 or 503 |
| `GET /api/v1/expenses?page=1&limit=20` | Paginated demo owner's expenses |

```sh
curl --fail http://127.0.0.1:4000/health
curl --fail 'http://127.0.0.1:4000/api/v1/expenses?page=1&limit=20'
```

Expense responses use `{ "data": [...], "meta": { "page": 1, "limit": 20, "hasMore": false } }`. Items have `id`, `amount`, `currency`, `category`, `reason`, `spentFor`, `paymentMethod`, `expenseDate`, `createdAt`, `updatedAt`. Amounts are decimal **strings** (e.g. `"250.00"`) to preserve precision; timestamps are ISO strings. Results sort by expense date descending, then ID descending for stable pagination.

Page defaults to 1 (maximum 10000), limit defaults to 20 (maximum 100). Unknown parameters, including client-supplied `userId`, return 400. Empty pages return 200 with an empty array. Errors use `{ "error": { "code": "...", "message": "...", "details": [...] } }`; details are included only where relevant. Unknown routes return 404; unexpected failures return a safe 500 without SQL, credentials or stack traces.

**Auth is not implemented.** The temporary `demo-user.js` middleware sets a fixed server-configured demo identity only when `NODE_ENV=development` and `DEMO_USER_ID` is set. Other environments or an unset ID return 401. This is a local demo, not an authentication mechanism: keep it bound to localhost and use demo data. No user ID is accepted from headers/body/query. Replace this middleware with verified session auth before exposing the app or adding real personal data.

## Layout and naming

```text
src/
  app.js                         # Route composition; no listener
  server.js                      # Startup / shutdown lifecycle
  config/env.js                  # Validated configuration
  db/
    pool.js                      # PostgreSQL pool + connectivity check
    client.js                    # Drizzle client using that pool
    schema.js                    # Central exports of feature models
    columns.js                   # Shared timestamp column factory
  modules/
    health/health.routes.js
    expenses/
      expense.model.js           # Drizzle expenses table
      expense.routes.js          # URL + middleware wiring
      expense.controller.js      # HTTP input/output
      expense.schema.js          # Zod query validation (not a DB model)
      expense.service.js         # Pagination / application behavior
      expense.repository.js      # Scoped Drizzle query
    users/user.model.js          # Drizzle users table
    auth/, categories/, admin/   # Future feature placeholders
  middleware/                    # Demo identity, 404 and error handlers
  utils/                         # ApiError and response helper
scripts/                         # DB check, migrations, demo seed
migrations/                      # SQL plus Drizzle metadata; commit both
tests/                          # Validation + opt-in DB/API tests
```

Files use lowercase kebab-case for utilities and `entity.layer.js` for feature layers. Functions/variables and JSON properties use camelCase, classes use PascalCase, environment variables use UPPER_SNAKE_CASE. Database tables are plural snake_case; columns/constraints/indexes use snake_case. `*.model.js` files define Drizzle database models; `*.schema.js` files inside feature folders define Zod request validation. The special `db/schema.js` file only re-exports database models for Drizzle. Avoid duplicate model definitions. Local ESM imports include `.js`; use `import/export`, not CommonJS.

Models import foreign-key targets directly from the related `*.model.js`, never through the central export file. Register any new model in `db/schema.js` so migration generation and the runtime client discover it. Add `user.schema.js` when implementing user/auth input validation; no unused validation placeholder is needed yet.

## Models and migration workflow

`users`: UUID, unique normalized email, display name, created/updated timestamps. It is only an owner model: passwords, roles, status and sessions come with auth.

`expenses`: UUID, owner foreign key, positive `NUMERIC(12,2)` amount, three-letter uppercase currency, category, reason, spent-for, payment method, expense date and timestamps. Payment methods: cash, upi, card, bank_transfer, other. Category is a string in this initial slice; a category table/policy comes later. Owner deletion is restricted. The owner/date/ID index supports listing. Currency validation checks format, not whether a currency exists in an ISO registry.

Database triggers update `updated_at` for both SQL and ORM updates; `created_at` stays unchanged. Trigger SQL is a custom migration and will not be generated from Drizzle's table model.

```sh
# Edit the relevant modules/<feature>/*.model.js, then generate and inspect the SQL:
npm run db:generate -- --name=describe-change
npm run db:migrate
# For custom SQL such as triggers:
npm run db:generate -- --custom --name=describe-custom-change
```

Commit generated SQL **and** `migrations/meta/`. Do not edit already applied migrations or run schema push as a substitute for versioned migrations. Startup never auto-migrates. Rollback is a reviewed compensating migration (or a tested backup restore), not an automatic destructive command. The original unused node-pg-migrate dependency/commands have been removed; an empty legacy `pgmigrations` metadata table may remain locally and is not used by Drizzle.

## Environment

| Variable | Default / example | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | development / test / production |
| `HOST` | `127.0.0.1` | Local bind address |
| `PORT` | `4000` | HTTP port (1–65535) |
| `DATABASE_URL` | See `.env.example` | Required Node database URL |
| `DEMO_USER_ID` | See `.env.example` | Optional fixed local demo UUID; never used in production |

Run commands here so `.env` resolves correctly. Node loads it natively; externally supplied environment values take precedence. Don't overwrite working local credentials with example placeholders.

## Lifecycle

Startup loads/validates env → runs `SELECT 1` → opens HTTP listener. Unreachable DB or occupied port exits with code 1; error logs omit credentials. SIGINT/SIGTERM stops new HTTP connections, drains active requests and closes the pool; a 10-second deadline prevents hanging shutdown. Nodemon sends SIGTERM for restarts, exercising the same cleanup. Readiness checks the live DB after startup; liveness only checks the running process.

## Checks

```sh
npm test
npm run test:integration
npm audit
```

`npm test` runs validation tests and skips integration by default. The opt-in integration command uses the configured DB, inserts uniquely named temporary users/expenses and removes only those fixtures in `finally`. Run it against a disposable development/test DB with migrations applied, never production. It checks ownership isolation, pagination, decimal output, validation errors, 404, production access blocking, DB constraints and updated-at triggers. An interrupted process can leave test fixtures; it never resets tables.

For a clean dependency install use `npm ci`. Lockfile overrides select patched minimatch for nodemon and esbuild for Drizzle's legacy CLI loader; generation and API workflows have been verified with these versions. Review overrides when upstream updates. Optional native install-script notices do not require enabling scripts when the checked workflows already work.

Next: replace demo identity with persistent session auth, then add expense create/edit/delete and role policies. See [the roadmap](../docs/backend-roadmap.md).

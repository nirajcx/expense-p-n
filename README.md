# Expense calculator — backend practice

Two independent implementations of the same product. `frontend/` is reserved for later and has not been changed.

| Backend | Stack | Port | Local database | Local app role |
| --- | --- | --- | --- | --- |
| `node-backend/` | Node 24, Express, ESM, Drizzle + pg | 4000 | expense_node | expense_node_app |
| `fastapi-backend/` | Python 3.12+, FastAPI, SQLAlchemy 2, psycopg 3 | 8000 | expense_fastapi | expense_fastapi_app |

## What we are building

A personal expense tracker implemented twice to practice backend engineering:

- Users sign up, log in with server-side sessions, log out, and manage their own expenses.
- Expenses include amount, currency, category, reason, who/what the expense was for, payment method, expense date, created_at and updated_at.
- Expense lists support pagination, filters and totals.
- An admin panel will expose only explicitly authorized user/expense operations.
- A superadmin can inspect user details and expenses, make permitted edits, disable users, and revoke a user's individual session or all sessions.
- Privileged actions are audited; password hashes and raw session tokens are never shown in the admin panel.
- Next.js frontend integration comes later; the current phase is backend setup only.

The read-only Node demo slice is implemented; signup/session auth, mutations and admin capabilities below remain planned. Both backends solve the same problem independently; neither calls the other or shares its tables/sessions.

## What is ready

- Separate PostgreSQL databases and non-superuser roles in the existing `postgres18` Docker container (host port 5432).
- Local `.env` files with independently generated passwords, ignored by Git; safe `.env.example` files for documentation.
- Environment validation, bounded connection pools, startup database check, liveness/readiness endpoints and shutdown cleanup.
- Node: Drizzle models/migrations for users and expenses, demo seed, paginated expense GET API, query validation and safe errors.
- FastAPI: connection/health skeleton and Alembic tooling; business models and endpoints remain practice work.
- Session auth, mutation endpoints and admin features are still pending.
- Dependency lockfiles for reproducible installs.

This is a development foundation, not a finished production deployment. The local DB roles own their own databases for learning migrations; production should separate migration ownership from restricted runtime DML privileges. Existing unrelated databases were not changed.

## Prerequisites

- Node.js 24.x and npm (optionally nvm; `node-backend/.nvmrc` selects 24).
- Python 3.12+ and uv (`fastapi-backend/.python-version` pins the local Python line).
- Docker with PostgreSQL running and a host port available. This workspace uses the existing `postgres18` container on port 5432.
- Git. Commit dependency lockfiles, migrations and sanitized env examples.

## Run locally

Start your existing container if necessary: `docker start postgres18`. Use separate terminals, starting from this repository root:

```sh
cd node-backend
npm ci
npm run db:check
npm run db:migrate
npm run db:seed
npm run dev
```

```sh
cd fastapi-backend
uv sync --locked
uv run db-check
uv run uvicorn fastapi_backend.main:app --reload --host 127.0.0.1 --port 8000
```

```sh
curl --fail http://127.0.0.1:4000/health/ready
curl --fail http://127.0.0.1:8000/health/ready
```

Node also exposes `GET /health` and `GET /api/v1/expenses?page=1&limit=20`. The expense route uses a local development demo identity; outside development or without `DEMO_USER_ID`, it returns 401 until session auth is implemented. Never expose demo mode with real personal data.

Both apps expose `/health/live` (process alive) and `/health/ready` (DB query succeeds). FastAPI also exposes `/docs`. A missing/unreachable DB prevents startup; readiness returns 503 if it becomes unavailable later.

Run backend commands **inside that backend directory** so `.env` resolves correctly. OS environment variables override `.env`. `.env.example` contains placeholders, not working passwords; don't copy it over the configured local `.env`.

## Another machine / fresh database

From the repository root, create local env files **only when they do not already exist**:

```sh
cp -n node-backend/.env.example node-backend/.env
cp -n fastapi-backend/.env.example fastapi-backend/.env
```

Connect to your existing container as a PostgreSQL administrator:

```sh
docker exec -it postgres18 psql -U postgres -d postgres
```

For a fresh database instance, run the following in `psql`. If these names already exist, reuse their configured credentials instead of recreating or dropping them:

```sql
CREATE ROLE expense_node_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
\password expense_node_app
CREATE DATABASE expense_node OWNER expense_node_app;
REVOKE ALL ON DATABASE expense_node FROM PUBLIC;

CREATE ROLE expense_fastapi_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
\password expense_fastapi_app
CREATE DATABASE expense_fastapi OWNER expense_fastapi_app;
REVOKE ALL ON DATABASE expense_fastapi FROM PUBLIC;
\q
```

The `\password` commands prompt for passwords without placing them in SQL history. Choose different strong passwords, then replace `CHANGE_ME` in each local env file with the matching URL-encoded password. Node uses `postgresql://`; SQLAlchemy uses `postgresql+psycopg://`. Keep the configured DB names/users consistent. Follow the install/run commands above after saving the env files.

The apps currently run on your host, so DB host is `127.0.0.1`. If you containerize the apps later, use the PostgreSQL Docker service/network hostname instead. Never commit real credentials. For remote production DBs use verified TLS; don't disable certificate validation.

## Folder responsibilities

- Node uses layer-based folders directly under `node-backend/`: `config`, `controllers`, `models`, `routes`, `middlewares`, `services`, `utils`, `database` and `tests`. `schemas` holds Zod validation; `repositories` holds DB queries. `app.js` composes the app and `server.js` starts it.
- Python `core`: settings; `db`: engine/session/Base; `modules`: feature code.
- FastAPI retains feature-based `modules/` placeholders for `auth`, `users`, `expenses`, `categories` and `admin`. Node features are grouped by layer; add future auth files to the corresponding folders.
- Both `migrations/` track explicit schema changes. No automatic table creation at application startup.

As you implement a feature, add only needed files: route/controller handles HTTP, service enforces business rules, repository handles queries, schema validates input/output. Python equivalents are router/service/repository/schemas/models. Don't create empty abstraction layers just to fill a diagram.

## Implementation order

| Phase | Work | Completion checkpoint |
| --- | --- | --- |
| 0 — setup (ready) | Folders, env, ESM, nodemon, DB pools, lifecycle, migration tooling | Both readiness endpoints return 200 |
| 1 — initial Node slice (ready) | Drizzle users/expenses, timestamp triggers, scoped GET, pagination | Real DB/API tests pass |
| 1b — expand schema | Category policy, sessions, audit events; FastAPI models | Reviewed constraints/relationships and migrations |
| 2 — middleware | Validation, errors, logging, headers, rate limits | Safe and consistent invalid-request responses |
| 3 — auth | Signup, password hashing, persistent sessions, login/logout, CSRF | Expiry, rotation and revocation tests pass |
| 4 — expenses | Ownership checks, CRUD, filters, pagination, totals | One user cannot read/change another user's expenses |
| 5 — administration | Role permissions, audited edits, disable/revoke sessions | Superadmin controls work without exposing secrets |
| 6 — frontend | Next.js screens and cookie-based integration | End-to-end user and admin flows work |
| 7 — deployment | CI, restricted DB roles, HTTPS, backups, observability | Deployment and restore checks pass |

Implement the feature code yourself; use reviews to validate decisions and debug. No full auth/CRUD solution is included in this starter.

## Practice sequence

See [the roadmap](docs/backend-roadmap.md). Start by proposing your schema and relationships; then implement migrations, middleware, and session auth one step at a time. The two backends must stay independent: no shared tables, passwords, cookies, or session store.

## Official references

- [Node ES modules](https://nodejs.org/api/packages.html#type)
- [Express session middleware](https://expressjs.com/en/resources/middleware/session/)
- [Express security guidance](https://expressjs.com/en/advanced/best-practice-security/)
- [SQLAlchemy psycopg dialect](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#module-sqlalchemy.dialects.postgresql.psycopg)

## Setup verification

Verified both real database connections, both HTTP health endpoints and graceful shutdown. Drizzle migration generation/application and Alembic revision generation/current/upgrade were checked. The old node-pg-migrate tooling was replaced by Drizzle. Node now has users/expenses tables, timestamp triggers and a demo fixture; FastAPI still has only migration metadata. Node dependency audit reported zero advisories after the documented CLI dependency overrides. Feature/security tests belong to the implementation milestones; these smoke checks do not establish production readiness.

## Lifecycle and troubleshooting

Both servers validate settings and check PostgreSQL before accepting HTTP requests. After startup, `/health/live` checks the process; `/health/ready` actually queries the DB and returns 503 if unavailable. Node drains HTTP requests and closes its pool on Ctrl+C, SIGTERM and nodemon restarts, with a 10-second deadline. FastAPI closes its engine through the application lifespan hook.

| Symptom | Check |
| --- | --- |
| Missing `.env` / invalid settings | Run inside the backend folder; create local env from its example and fill credentials |
| DB connection fails | `docker ps`, host port 5432, DB name/user/password; then run the backend DB-check command |
| Address already in use | Stop the existing process or change Node `PORT` / Uvicorn `--port` |
| Nodemon says app crashed | Fix the startup error, save a watched file, or type `rs` |
| Migration generates no tables | Define models first; import Python models in `migrations/env.py` for autogeneration |
| DB stopped after server startup | Readiness should return 503; restart PostgreSQL and recheck |

Do not use database reset/drop commands to fix a connection error. Stopping an app does not stop the shared PostgreSQL container. Migrations never run automatically at server startup.

## Git hygiene

The root `.gitignore` applies across both backends and excludes real `.env` files, private key files, dependencies, virtual environments, Python caches, build output, logs, coverage, Next.js output and local database backups. `.env.example`, SQL/Python migrations, `package-lock.json` and `uv.lock` remain versioned. Never ignore all `.sql` files: they are migration source code.

Before committing:

```sh
git status --short
git diff --check
git check-ignore node-backend/.env fastapi-backend/.env
```

Ignoring a path does not untrack an already committed secret. If that happens, rotate the credential and remove it from tracking/history as appropriate. Keep personal editor settings local and review staged files before committing.

Backend-specific command references: [Express](node-backend/README.md) · [FastAPI](fastapi-backend/README.md).

## Ready for your initial implementation commit

See [Node documentation](node-backend/README.md) for API response shapes, models, naming conventions and migration commands. Run these from the appropriate directories before committing:

```sh
cd node-backend
npm ci
npm test
npm run db:migrate
npm run test:integration
npm audit
cd ..
git diff --check
git status --short
```

Review files before staging. Include source, tests, documentation, env examples, both lockfiles and Drizzle migration metadata. Exclude `.env`, dependencies, caches and local data. No commit or staging is performed by setup; you choose what to include, especially the existing frontend files. This repository already has an initial README commit, so your next commit can be `feat: bootstrap expense backends and Node read API`.

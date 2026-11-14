# FastAPI backend

Use Python 3.12+ and uv. Run commands from this directory.

```sh
uv sync --locked
uv run db-check
uv run uvicorn fastapi_backend.main:app --reload --host 127.0.0.1 --port 8000
```

`core/config.py` loads `.env`. SQLAlchemy uses the async psycopg 3 driver; keep the `postgresql+psycopg://` URL prefix. `db/session.py` provides `Base`, an async session factory and a future request dependency. Services should explicitly decide when to commit or roll back.

After writing your first model, import its module in `migrations/env.py` so Alembic can discover it:

```sh
uv run alembic revision --autogenerate -m 'create users'
# Read generated upgrade AND downgrade operations before applying.
uv run alembic upgrade head
uv run alembic current
```

`uv run alembic downgrade -1` reverses the latest revision and may delete data. Autogenerate is a draft, not a schema correctness check. Don't use `Base.metadata.create_all()` at startup. This starter config supports online migrations only.

See [root setup](../README.md) and [practice roadmap](../docs/backend-roadmap.md). No feature endpoints or auth are implemented.

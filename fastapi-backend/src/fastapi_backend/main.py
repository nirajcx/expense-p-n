from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from fastapi_backend.db.check import check_database
from fastapi_backend.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        try:
            await check_database()
        except Exception:
            raise RuntimeError("Database unavailable. Check DATABASE_URL and PostgreSQL.") from None
        yield
    finally:
        await engine.dispose()


app = FastAPI(title="Expense API", lifespan=lifespan)


@app.get("/health/live")
async def live():
    return {"status": "ok"}


@app.get("/health/ready")
async def ready():
    try:
        await check_database()
        return {"status": "ready"}
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unavailable"})

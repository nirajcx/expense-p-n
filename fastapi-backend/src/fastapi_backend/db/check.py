import asyncio

from sqlalchemy import text

from fastapi_backend.db.session import engine


async def check_database():
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))


async def run():
    try:
        await check_database()
        print("PostgreSQL connection OK")
    except Exception:
        raise SystemExit("PostgreSQL connection failed. Check DATABASE_URL and the container.") from None
    finally:
        await engine.dispose()


def main():
    asyncio.run(run())

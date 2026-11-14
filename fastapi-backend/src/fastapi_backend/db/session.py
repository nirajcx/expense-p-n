from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from fastapi_backend.core.config import get_settings

engine = create_async_engine(
    str(get_settings().database_url),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
    pool_timeout=5,
    connect_args={"connect_timeout": 5, "options": "-c statement_timeout=5000"},
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session():
    # Services will own transaction boundaries; closing rolls back unfinished work.
    async with SessionLocal() as session:
        yield session

import asyncio

from alembic import context

from fastapi_backend.db.session import Base, engine

# Import future model modules here so autogenerate can discover their tables.
target_metadata = Base.metadata


def run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_online():
    try:
        async with engine.connect() as connection:
            await connection.run_sync(run_migrations)
    finally:
        await engine.dispose()


if context.is_offline_mode():
    raise RuntimeError('Use online migrations for this starter.')
else:
    asyncio.run(run_online())

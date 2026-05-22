"""
app/core/database.py

Async SQLAlchemy engine and session factory.

Architecture:
  - Uses asyncpg driver for high-performance async PostgreSQL connections.
  - Provides a FastAPI dependency `get_db` for per-request database sessions.
  - `init_db()` creates tables if they don't exist (development-friendly).
    For production, use Alembic migrations instead.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# ─── Engine ──────────────────────────────────────────────────────────────────
engine_args = {
    "echo": settings.APP_DEBUG,
}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    engine_args["pool_pre_ping"] = True
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_args
)

# ─── Session Factory ──────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,        # Avoid lazy-load errors after commit
    autocommit=False,
    autoflush=False,
)


# ─── Base Model ───────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    Declarative base for all SQLAlchemy ORM models.
    All models must inherit from this class.
    """
    pass


# ─── Database Dependency ─────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session per request.

    Usage:
        @router.get("/resource")
        async def get_resource(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ─── Table Initialization ─────────────────────────────────────────────────────
async def init_db() -> None:
    """
    Creates all database tables based on registered SQLAlchemy models.

    Called at application startup. Safe to call multiple times (CREATE IF NOT EXISTS).
    For production, replace with Alembic migration: `alembic upgrade head`.
    """
    # Import models here to ensure they're registered on Base.metadata
    from app.models import user, session, record, subscription, tone_report  # noqa: F401
    from sqlalchemy import text

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Dynamic migration for SQLite to support V2 speaking trainer columns
        if settings.DATABASE_URL.startswith("sqlite"):
            result = await conn.execute(text("PRAGMA table_info(emotion_sessions)"))
            cols = [row[1] for row in result.fetchall()]
            
            new_cols = {
                "session_type": "VARCHAR(50) DEFAULT 'live'",
                "confidence_score": "FLOAT",
                "stability_score": "FLOAT",
                "eye_contact_score": "FLOAT",
                "speaking_energy": "FLOAT",
                "script_text": "TEXT"
            }
            for col, col_type in new_cols.items():
                if col not in cols:
                    await conn.execute(text(f"ALTER TABLE emotion_sessions ADD COLUMN {col} {col_type}"))

        # Dynamic migration for user premium columns
        if settings.DATABASE_URL.startswith("sqlite"):
            result_users = await conn.execute(text("PRAGMA table_info(users)"))
            user_cols = [row[1] for row in result_users.fetchall()]
            premium_cols = {
                "is_premium": "BOOLEAN DEFAULT 0",
                "premium_activated_at": "TIMESTAMP",
                "premium_expires_at": "TIMESTAMP",
            }
            for col, col_type in premium_cols.items():
                if col not in user_cols:
                    await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))

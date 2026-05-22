"""
app/core/config.py

Central configuration module. All environment variables are loaded here
using pydantic-settings. This is the SINGLE SOURCE OF TRUTH for app config.

Never import os.environ directly anywhere else in the app.
Always import `settings` from this module.
"""

from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables (.env file).
    Pydantic validates all types automatically at startup.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # ignore unknown env vars gracefully
    )

    # ─── Application ─────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_TITLE: str = "EmotionSense AI"
    APP_DESCRIPTION: str = "Production-grade real-time facial emotion detection API"
    APP_VERSION: str = "1.0.0"

    # ─── Database ────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/emotionsense"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, value: Any) -> str:
        """Normalize database connection string for asyncpg and cloud providers."""
        if isinstance(value, str):
            # If it starts with postgres:// or postgresql:// and doesn't contain a + driver, insert +asyncpg
            if value.startswith("postgres://") or (value.startswith("postgresql://") and "+asyncpg" not in value):
                value = value.replace("postgres://", "postgresql+asyncpg://", 1)
                value = value.replace("postgresql://", "postgresql+asyncpg://", 1)
            # Replace sslmode= with ssl= for asyncpg compatibility
            if "sslmode=" in value:
                value = value.replace("sslmode=", "ssl=")
        return value

    # ─── JWT Auth ────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ─── CORS ────────────────────────────────────────────────────
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://expression-sense.vercel.app",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, value: Any) -> list[str]:
        """Parse CORS origins from a string or a list."""
        if isinstance(value, str):
            import json
            try:
                return json.loads(value)
            except Exception:
                # Fallback: treat as a comma-separated string
                return [v.strip() for v in value.split(",") if v.strip()]
        return value

    # ─── File Limits ─────────────────────────────────────────────
    MAX_IMAGE_SIZE_BYTES: int = 10 * 1024 * 1024   # 10 MB
    MAX_VIDEO_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB

    # ─── AI Configuration ────────────────────────────────────────
    EMOTION_CONFIDENCE_THRESHOLD: float = 30.0  # Minimum confidence % to report


# Singleton settings instance — import this everywhere
settings = Settings()

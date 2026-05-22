"""
app/models/user.py

User database model.

Represents registered platform users. Stores credentials and profile info.
Password is NEVER stored in plain text — only bcrypt hashes.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.session import EmotionSession
    from app.models.subscription import Subscription
    from app.models.tone_report import ToneReport


class User(UUIDMixin, TimestampMixin, Base):
    """
    Users table. One user can have many emotion detection sessions.

    Relationships:
        sessions:      All emotion detection sessions belonging to this user.
        subscription:  The user's active premium subscription record.
        tone_reports:  All AI tone coaching reports generated for this user.
    """

    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # ── Premium subscription flags ─────────────────────────────────────────────
    is_premium: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="0", nullable=False
    )
    premium_activated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    premium_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    # One user → many emotion detection sessions
    sessions: Mapped[List["EmotionSession"]] = relationship(
        "EmotionSession",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",
    )

    # One user → one active subscription record
    subscription: Mapped[Optional["Subscription"]] = relationship(
        "Subscription",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # One user → many tone coaching reports
    tone_reports: Mapped[List["ToneReport"]] = relationship(
        "ToneReport",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"

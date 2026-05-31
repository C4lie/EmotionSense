"""
app/models/session.py

EmotionSession database model.

Represents a single detection session (e.g., one live webcam session
or one image/video upload). Aggregated statistics are stored here for
fast dashboard queries without scanning all emotion_records each time.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.record import EmotionRecord
    from app.models.analytics import Analytics
    from app.models.recommendation import Recommendation


class EmotionSession(UUIDMixin, TimestampMixin, Base):
    """
    emotion_sessions table. Each session belongs to one user (nullable for guests).

    A session groups all emotion records captured during a single detection run.
    After a session ends, we aggregate and store summary stats here.

    Relationships:
        user: The owner of this session (nullable for unauthenticated detections).
        records: All frame-level emotion records captured in this session.
    """

    __tablename__ = "emotion_sessions"

    # FK to users table — nullable to support guest usage
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Aggregated session summary (written when session ends)
    dominant_emotion: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    average_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # V2 Speaking Trainer metrics
    session_type: Mapped[str] = mapped_column(String(50), default="live", server_default="live", nullable=False)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stability_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    eye_contact_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    speaking_energy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    script_text: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Session timing
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ─── Relationships ────────────────────────────────────────────
    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="sessions",
    )

    records: Mapped[List["EmotionRecord"]] = relationship(
        "EmotionRecord",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="EmotionRecord.timestamp",
        lazy="select",
    )

    analytics_report: Mapped[Optional["Analytics"]] = relationship(
        "Analytics",
        back_populates="session",
        cascade="all, delete-orphan",
        uselist=False,
    )

    recommendation_list: Mapped[List["Recommendation"]] = relationship(
        "Recommendation",
        back_populates="session",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<EmotionSession id={self.id} "
            f"dominant={self.dominant_emotion!r} "
            f"user_id={self.user_id}>"
        )

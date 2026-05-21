"""
app/models/record.py

EmotionRecord database model.

Represents a single frame-level detection result within a session.
Every time a face is detected and analyzed, one EmotionRecord is inserted.

This granular storage enables: replay, timeline charts, and analytics.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.session import EmotionSession


class EmotionRecord(UUIDMixin, Base):
    """
    emotion_records table. Each row = one face detected in one frame.

    Multi-face support: multiple records per timestamp (one per face_index).
    All 7 emotion confidence scores are stored for full analytics capability.

    Relationships:
        session: The parent session this record belongs to.
    """

    __tablename__ = "emotion_records"

    # FK to parent session — cascade delete removes records when session deleted
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("emotion_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Timestamp of when this frame was processed
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Which face in the frame this is (0-indexed, supports multi-face)
    face_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Bounding box coordinates (in original frame pixel space)
    box_x: Mapped[int] = mapped_column(Integer, nullable=False)
    box_y: Mapped[int] = mapped_column(Integer, nullable=False)
    box_w: Mapped[int] = mapped_column(Integer, nullable=False)
    box_h: Mapped[int] = mapped_column(Integer, nullable=False)

    # Dominant result
    dominant_emotion: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    # All 7 emotion confidence scores (stored for full analytics capability)
    happy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    sad: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    angry: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    neutral: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fear: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    surprise: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    disgust: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # ─── Relationships ────────────────────────────────────────────
    session: Mapped["EmotionSession"] = relationship(
        "EmotionSession",
        back_populates="records",
    )

    def __repr__(self) -> str:
        return (
            f"<EmotionRecord id={self.id} "
            f"session_id={self.session_id} "
            f"face={self.face_index} "
            f"emotion={self.dominant_emotion!r} "
            f"conf={self.confidence:.1f}>"
        )

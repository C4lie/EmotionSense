"""
app/models/analytics.py

Analytics database model.
"""

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.session import EmotionSession


class Analytics(UUIDMixin, TimestampMixin, Base):
    """
    analytics table.
    Stores the final aggregated visual, audio, and posture analysis scores for a session.
    """

    __tablename__ = "analytics"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("emotion_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )

    confidence_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    communication_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    eye_contact_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tone_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationship
    session: Mapped["EmotionSession"] = relationship("EmotionSession", back_populates="analytics_report")

    def __repr__(self) -> str:
        return f"<Analytics id={self.id} session_id={self.session_id} conf={self.confidence_score}>"

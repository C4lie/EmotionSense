import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import DateTime, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Streak(TimestampMixin, Base):
    """
    Streaks table. Tracks consecutive days of practice.
    """

    __tablename__ = "streaks"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_practice_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    streak_freezes_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    milestones_achieved: Mapped[List[int]] = mapped_column(JSON, default=list, nullable=False)

    def __repr__(self) -> str:
        return f"<Streak user_id={self.user_id} current={self.current_streak} longest={self.longest_streak}>"

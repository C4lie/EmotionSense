"""
app/models/subscription.py

Subscription database model.

Tracks user subscription plans and status. Designed to support
Stripe integration in Phase 2 via stripe_subscription_id field.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, String, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class Subscription(UUIDMixin, TimestampMixin, Base):
    """
    subscriptions table.

    One active subscription per user at a time.
    Stores plan, status, and optional Stripe reference for Phase 2 billing.
    """

    __tablename__ = "subscriptions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    plan: Mapped[str] = mapped_column(String(50), default="premium", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Reserved for Stripe webhook integration (Phase 2)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="subscription")

    def __repr__(self) -> str:
        return f"<Subscription user_id={self.user_id} plan={self.plan!r} status={self.status!r}>"

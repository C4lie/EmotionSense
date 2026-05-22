"""
app/services/subscription_service.py

Subscription business logic service.

Architecture: Controller → Service → Model
Handles all premium subscription operations.
Stripe integration hooks are stubbed for Phase 2.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.user import User
from app.models.subscription import Subscription


class SubscriptionService:
    """
    Manages user subscription state.
    Phase 1: Mock activation (no real payment processor).
    Phase 2: Wire Stripe webhooks to set_premium_active().
    """

    async def get_status(self, db: AsyncSession, user_id: str) -> dict:
        """
        Return the current subscription status for a user.
        Returns a dict with: is_premium, plan, activated_at, expires_at.
        """
        user = await self._get_user(db, user_id)
        if not user:
            return {
                "is_premium": False,
                "plan": "free",
                "activated_at": None,
                "expires_at": None,
            }

        return {
            "is_premium": user.is_premium,
            "plan": "premium" if user.is_premium else "free",
            "activated_at": (
                user.premium_activated_at.isoformat() if user.premium_activated_at else None
            ),
            "expires_at": (
                user.premium_expires_at.isoformat() if user.premium_expires_at else None
            ),
        }

    async def activate_premium(self, db: AsyncSession, user_id: str) -> dict:
        """
        Activate premium for the user (Phase 1 mock — no payment required).
        Creates a Subscription record and marks user.is_premium = True.
        """
        user = await self._get_user(db, user_id)
        if not user:
            raise ValueError("User not found.")

        if user.is_premium:
            return await self.get_status(db, user_id)

        now = datetime.now(timezone.utc)
        user.is_premium = True
        user.premium_activated_at = now
        user.premium_expires_at = None  # No expiry in mock mode

        # Create audit record
        sub = Subscription(
            user_id=user.id,
            plan="premium",
            status="active",
            started_at=now,
        )
        db.add(sub)
        await db.flush()

        logger.info(f"[SubscriptionService] Premium activated for user_id={user_id}")
        return await self.get_status(db, user_id)

    async def cancel_premium(self, db: AsyncSession, user_id: str) -> dict:
        """
        Cancel premium subscription. Sets user.is_premium = False.
        Updates the active subscription record status to 'cancelled'.
        """
        user = await self._get_user(db, user_id)
        if not user:
            raise ValueError("User not found.")

        user.is_premium = False
        user.premium_expires_at = datetime.now(timezone.utc)

        # Mark the active subscription as cancelled
        result = await db.execute(
            select(Subscription)
            .where(Subscription.user_id == user.id)
            .where(Subscription.status == "active")
        )
        sub = result.scalar_one_or_none()
        if sub:
            sub.status = "cancelled"
            sub.expires_at = datetime.now(timezone.utc)

        await db.flush()
        logger.info(f"[SubscriptionService] Premium cancelled for user_id={user_id}")
        return await self.get_status(db, user_id)

    async def _get_user(self, db: AsyncSession, user_id: str) -> Optional[User]:
        """Fetch user by UUID string."""
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            return None
        result = await db.execute(select(User).where(User.id == uid))
        return result.scalar_one_or_none()


# Singleton instance
subscription_service = SubscriptionService()

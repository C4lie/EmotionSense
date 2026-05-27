import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.streak import Streak


MILESTONES = [3, 7, 14, 30, 60, 100]


class StreakService:
    """
    Business logic for user streak maintenance.
    """

    async def get_or_create_streak(self, db: AsyncSession, user_id: str) -> Streak:
        """Fetch user's streak object. Creates one if it doesn't exist."""
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            raise ValueError("Invalid user_id")

        result = await db.execute(select(Streak).where(Streak.user_id == uid))
        streak = result.scalar_one_or_none()

        if not streak:
            streak = Streak(
                user_id=uid,
                current_streak=0,
                longest_streak=0,
                last_practice_date=None,
                streak_freezes_used=0,
                milestones_achieved=[],
            )
            db.add(streak)
            await db.flush()
            await db.refresh(streak)

        return streak

    async def register_activity(self, db: AsyncSession, user_id: str) -> Streak:
        """
        Increments user streak if they completed a challenge or speaking session today.
        Timezone-aware day-boundaries apply.
        """
        streak = await self.get_or_create_streak(db, user_id)
        now = datetime.now(timezone.utc)

        if streak.last_practice_date:
            last_date = streak.last_practice_date.date()
            today_date = now.date()

            # Already practiced today — do not double-increment
            if last_date == today_date:
                return streak

            # Practiced yesterday — increment streak
            elif last_date == today_date - timedelta(days=1):
                streak.current_streak += 1
            else:
                # Practiced before yesterday — streak is broken
                streak.current_streak = 1
        else:
            # First practice session
            streak.current_streak = 1

        # Check longest streak boundary
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak

        # Update last practice timestamp
        streak.last_practice_date = now

        # Evaluate milestones
        new_milestones = []
        for m in MILESTONES:
            if streak.current_streak >= m and m not in streak.milestones_achieved:
                new_milestones.append(m)

        if new_milestones:
            # SQLAlchemy mutable JSON workaround (append and reassign)
            achieved = list(streak.milestones_achieved)
            achieved.extend(new_milestones)
            streak.milestones_achieved = achieved
            logger.info(f"[StreakService] User={user_id} achieved new milestone(s): {new_milestones}")

        await db.flush()
        logger.info(
            f"[StreakService] User={user_id} activity recorded. "
            f"Streak: {streak.current_streak} (Longest: {streak.longest_streak})"
        )
        return streak

    async def check_reset(self, db: AsyncSession, user_id: str) -> Streak:
        """
        Checks if the streak should be reset because the user missed practicing yesterday.
        Returns the updated streak.
        """
        streak = await self.get_or_create_streak(db, user_id)
        if not streak.last_practice_date:
            return streak

        now = datetime.now(timezone.utc)
        last_date = streak.last_practice_date.date()
        today_date = now.date()

        # Missed yesterday and today -> Reset current streak
        if last_date < today_date - timedelta(days=1):
            streak.current_streak = 0
            await db.flush()
            logger.info(f"[StreakService] User={user_id} streak reset to 0 (missed practice)")

        return streak

    async def use_freeze(self, db: AsyncSession, user_id: str) -> Streak:
        """
        Uses a streak freeze for the user to prevent streak reset.
        Requires premium subscription.
        Sets the last_practice_date to yesterday if they missed it, and increments streak_freezes_used.
        """
        from app.services.subscription_service import subscription_service
        status = await subscription_service.get_status(db, user_id)
        if not status["is_premium"]:
            raise ValueError("Streak freeze is a premium feature. Please upgrade to premium.")

        streak = await self.get_or_create_streak(db, user_id)
        now = datetime.now(timezone.utc)
        
        streak.streak_freezes_used += 1
        # Set last_practice_date to yesterday to preserve the streak
        yesterday = now - timedelta(days=1)
        streak.last_practice_date = yesterday
        
        await db.flush()
        logger.info(f"[StreakService] User={user_id} used a streak freeze. Freezes used: {streak.streak_freezes_used}")
        return streak


streak_service = StreakService()

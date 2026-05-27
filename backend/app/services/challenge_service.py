import random
import uuid
from datetime import datetime, timezone, time as dt_time
from typing import List, Optional, Tuple

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.challenge import Challenge
from app.models.session import EmotionSession


CHALLENGE_TEMPLATES = [
    {
        "title": "Introductory Spark",
        "description": "Practice a short introduction. Speak confidently for at least 15 seconds.",
        "difficulty": "easy",
        "target_score": 50.0,
        "challenge_type": "introductory",
    },
    {
        "title": "The 60s Storyteller",
        "description": "Tell a personal story or describe a hobby. Maintain steady composture for at least 60 seconds.",
        "difficulty": "medium",
        "target_score": 60.0,
        "challenge_type": "storytelling",
    },
    {
        "title": "Composed Composure",
        "description": "Practice speaking under stress. Maintain an overall confidence rating of 70% or more for 30 seconds.",
        "difficulty": "hard",
        "target_score": 70.0,
        "challenge_type": "stability",
    },
    {
        "title": "Natural Smile Run",
        "description": "Vary your expressions. Bring in natural smiles while speaking for 30 seconds.",
        "difficulty": "medium",
        "target_score": 65.0,
        "challenge_type": "positivity",
    },
]


class ChallengeService:
    """
    Business logic for daily challenges.
    """

    async def get_or_create_daily_challenge(
        self, db: AsyncSession, user_id: str
    ) -> Challenge:
        """
        Retrieves today's daily challenge for the user.
        If none exists, picks one from templates and inserts it.
        """
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            raise ValueError("Invalid user_id")

        now = datetime.now(timezone.utc)
        today_start = datetime.combine(now.date(), dt_time.min, tzinfo=timezone.utc)
        today_end = datetime.combine(now.date(), dt_time.max, tzinfo=timezone.utc)

        # Check existing
        result = await db.execute(
            select(Challenge)
            .where(Challenge.user_id == uid)
            .where(Challenge.created_at.between(today_start, today_end))
        )
        challenge = result.scalar_one_or_none()

        if challenge:
            return challenge

        # Create new daily challenge from templates
        template = random.choice(CHALLENGE_TEMPLATES)
        challenge = Challenge(
            user_id=uid,
            challenge_type=template["challenge_type"],
            title=template["title"],
            description=template["description"],
            difficulty=template["difficulty"],
            target_score=template["target_score"],
            completed=False,
        )
        db.add(challenge)
        await db.flush()
        await db.refresh(challenge)

        logger.info(f"[ChallengeService] Created daily challenge '{challenge.title}' for user={user_id}")
        return challenge

    async def verify_challenge_completion(
        self, db: AsyncSession, user_id: str, session: EmotionSession
    ) -> Optional[Challenge]:
        """
        Verifies if the finished session meets the requirements of today's daily challenge.
        If it does, marks it completed.
        """
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            return None

        # Fetch today's challenge
        challenge = await self.get_or_create_daily_challenge(db, user_id)
        if challenge.completed:
            return challenge

        # Verify criteria
        session_duration = 0.0
        if session.ended_at and session.started_at:
            session_duration = (session.ended_at - session.started_at).total_seconds()

        # Score checks
        score = session.confidence_score or session.average_confidence or 0.0

        is_valid = False
        if challenge.challenge_type == "introductory":
            is_valid = session_duration >= 15.0 and score >= challenge.target_score
        elif challenge.challenge_type == "storytelling":
            is_valid = session_duration >= 60.0 and score >= challenge.target_score
        elif challenge.challenge_type == "stability":
            is_valid = session_duration >= 30.0 and score >= challenge.target_score
        elif challenge.challenge_type == "positivity":
            is_valid = session_duration >= 30.0 and score >= challenge.target_score
        else:
            is_valid = session_duration >= 20.0 and score >= challenge.target_score

        if is_valid:
            challenge.completed = True
            challenge.completed_at = datetime.now(timezone.utc)
            await db.flush()
            logger.info(f"[ChallengeService] Daily challenge '{challenge.title}' COMPLETED by user={user_id}")
            
            # Trigger streak increment on challenge completion
            from app.services.streak_service import streak_service
            await streak_service.register_activity(db, user_id)
            
            return challenge

        return None

    async def get_history(
        self, db: AsyncSession, user_id: str, page: int = 1, size: int = 10
    ) -> Tuple[int, List[Challenge]]:
        """Get paginated history of challenges."""
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            return 0, []

        offset = (page - 1) * size

        # Count total
        count_res = await db.execute(
            select(func.count()).select_from(Challenge).where(Challenge.user_id == uid)
        )
        total = count_res.scalar_one()

        # Select history
        result = await db.execute(
            select(Challenge)
            .where(Challenge.user_id == uid)
            .order_by(Challenge.created_at.desc())
            .offset(offset)
            .limit(size)
        )
        challenges = list(result.scalars().all())
        return total, challenges


challenge_service = ChallengeService()

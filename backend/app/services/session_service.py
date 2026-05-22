"""
app/services/session_service.py

Session management service layer.

Handles all database operations for EmotionSession and EmotionRecord models.
Called by the detect routes to persist inference results.

Architecture: Service → Model (never direct DB calls in routes).
"""

import uuid
from datetime import datetime, timezone
from statistics import mean
from typing import List, Optional

from loguru import logger
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.record import EmotionRecord
from app.models.session import EmotionSession
from app.schemas.detect import FaceDetectionDetail


class SessionService:
    """
    Manages emotion session lifecycle and record persistence.

    All methods are async and accept an AsyncSession as a dependency,
    following the Controller → Service → Model pattern.
    """

    async def create_session(
        self,
        db: AsyncSession,
        user_id: Optional[uuid.UUID] = None,
        session_type: str = "live",
        script_text: Optional[str] = None,
    ) -> EmotionSession:
        """
        Create a new EmotionSession row.

        Args:
            db: Active async database session.
            user_id: Optional user ID (None for guest/unauthenticated usage).
            session_type: Type of the session ("live" or "speaking").
            script_text: Optional text prompt read during the session.

        Returns:
            The newly created and flushed EmotionSession instance.
        """
        session = EmotionSession(
            user_id=user_id,
            session_type=session_type,
            script_text=script_text,
            started_at=datetime.now(timezone.utc),
        )
        db.add(session)
        await db.flush()  # Get the generated UUID without committing
        logger.debug(f"[Session] Created {session_type} session {session.id} (user_id={user_id})")
        return session

    async def add_records(
        self,
        db: AsyncSession,
        session_id: uuid.UUID,
        faces: List[FaceDetectionDetail],
        timestamp: Optional[datetime] = None,
    ) -> None:
        """
        Persist a list of FaceDetectionDetail objects as EmotionRecord rows.

        Called once per frame (image upload) or per analyzed frame (video).

        Args:
            db: Active async database session.
            session_id: Parent session UUID.
            faces: List of detected face analysis results.
            timestamp: When this frame was captured (defaults to now).
        """
        if not faces:
            return

        ts = timestamp or datetime.now(timezone.utc)

        for face in faces:
            scores = face.emotion_scores
            record = EmotionRecord(
                session_id=session_id,
                timestamp=ts,
                face_index=face.face_index,
                box_x=face.box.x,
                box_y=face.box.y,
                box_w=face.box.width,
                box_h=face.box.height,
                dominant_emotion=face.dominant_emotion,
                confidence=face.confidence,
                happy=scores.get("happy", 0.0),
                sad=scores.get("sad", 0.0),
                angry=scores.get("angry", 0.0),
                neutral=scores.get("neutral", 0.0),
                fear=scores.get("fear", 0.0),
                surprise=scores.get("surprise", 0.0),
                disgust=scores.get("disgust", 0.0),
            )
            db.add(record)

        logger.debug(f"[Session] Added {len(faces)} record(s) to session {session_id}")

    async def close_session(
        self,
        db: AsyncSession,
        session: EmotionSession,
    ) -> EmotionSession:
        """
        Finalise a session by aggregating summary statistics.

        Computes dominant_emotion and average_confidence from all records
        in this session and writes ended_at timestamp. Also calculates
        speaking trainer scores if applicable.

        Args:
            db: Active async database session.
            session: The EmotionSession to close.

        Returns:
            The updated EmotionSession instance.
        """
        # Fetch all records for this session
        result = await db.execute(
            select(EmotionRecord).where(EmotionRecord.session_id == session.id)
        )
        records: List[EmotionRecord] = list(result.scalars().all())

        session.ended_at = datetime.now(timezone.utc)

        if records:
            # Compute dominant emotion: most frequently occurring
            emotion_counts: dict = {}
            for r in records:
                emotion_counts[r.dominant_emotion] = emotion_counts.get(r.dominant_emotion, 0) + 1
            dominant = max(emotion_counts, key=emotion_counts.get)

            # Average confidence across all records
            avg_conf = mean(r.confidence for r in records)

            session.dominant_emotion = dominant
            session.average_confidence = round(avg_conf, 2)

            # Compute V2 telemetry metrics if speaking session
            if session.session_type == "speaking":
                duration_seconds = max(1.0, (session.ended_at - session.started_at).total_seconds())
                from app.services.confidence_service import confidence_service
                metrics = confidence_service.calculate_metrics(records, duration_seconds)
                session.confidence_score = metrics["confidence_score"]
                session.stability_score = metrics["stability_score"]
                session.eye_contact_score = metrics["eye_contact_score"]
                session.speaking_energy = metrics["speaking_energy"]

        await db.flush()

        logger.info(
            f"[Session] Closed session {session.id}: "
            f"type={session.session_type} dominant={session.dominant_emotion} "
            f"avg_conf={session.average_confidence}"
        )
        return session

    async def get_session(
        self,
        db: AsyncSession,
        session_id: uuid.UUID,
    ) -> Optional[EmotionSession]:
        """Fetch a session by its UUID. Returns None if not found."""
        result = await db.execute(
            select(EmotionSession).where(EmotionSession.id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_user_sessions_paginated(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        page: int = 1,
        size: int = 10,
    ) -> tuple[int, List[EmotionSession]]:
        """Fetch user sessions, paginated."""
        offset = (page - 1) * size
        count_stmt = select(func.count(EmotionSession.id)).where(
            and_(
                EmotionSession.user_id == user_id,
                EmotionSession.dominant_emotion.isnot(None)
            )
        )
        count_res = await db.execute(count_stmt)
        total = count_res.scalar_one()

        stmt = (
            select(EmotionSession)
            .where(
                and_(
                    EmotionSession.user_id == user_id,
                    EmotionSession.dominant_emotion.isnot(None)
                )
            )
            .order_by(EmotionSession.started_at.desc())
            .offset(offset)
            .limit(size)
        )
        res = await db.execute(stmt)
        sessions = list(res.scalars().all())
        return total, sessions

    async def get_session_details(
        self,
        db: AsyncSession,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Optional[EmotionSession]:
        """Fetch session and eager load its records. Verify it belongs to the user."""
        stmt = (
            select(EmotionSession)
            .where(and_(EmotionSession.id == session_id, EmotionSession.user_id == user_id))
            .options(selectinload(EmotionSession.records))
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    async def create_session_with_records(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        records: List[any],
        session_type: str = "live",
        script_text: Optional[str] = None,
    ) -> EmotionSession:
        """
        Create a new EmotionSession, batch insert its frame records, and finalise it.
        """
        started_at = datetime.now(timezone.utc)
        if records:
            # Parse earliest timestamp from records
            started_at = min(r.timestamp for r in records)
            if started_at.tzinfo is None:
                started_at = started_at.replace(tzinfo=timezone.utc)

        session = EmotionSession(
            user_id=user_id,
            session_type=session_type,
            script_text=script_text,
            started_at=started_at,
        )
        db.add(session)
        await db.flush()

        for r in records:
            ts = r.timestamp
            if ts and ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)

            record = EmotionRecord(
                session_id=session.id,
                timestamp=ts or datetime.now(timezone.utc),
                face_index=r.face_index,
                box_x=r.box_x,
                box_y=r.box_y,
                box_w=r.box_w,
                box_h=r.box_h,
                dominant_emotion=r.dominant_emotion,
                confidence=r.confidence,
                happy=r.happy,
                sad=r.sad,
                angry=r.angry,
                neutral=r.neutral,
                fear=r.fear,
                surprise=r.surprise,
                disgust=r.disgust,
            )
            db.add(record)

        await db.flush()
        # Aggregates dominant emotion and average confidence, and sets ended_at
        await self.close_session(db, session)
        return session

    async def delete_session(
        self,
        db: AsyncSession,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> bool:
        """Delete user's session. Returns True if deleted, False otherwise."""
        stmt = select(EmotionSession).where(
            and_(EmotionSession.id == session_id, EmotionSession.user_id == user_id)
        )
        res = await db.execute(stmt)
        session = res.scalar_one_or_none()
        if not session:
            return False
        await db.delete(session)
        await db.flush()
        return True


# ─── Singleton ────────────────────────────────────────────────────────────────
session_service = SessionService()

"""
app/routes/challenges.py

Daily challenges API endpoints.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.challenge_service import challenge_service
from app.models.session import EmotionSession

router = APIRouter(prefix="/challenges", tags=["Challenges"])

class ChallengeVerifyIn(BaseModel):
    session_id: str

@router.get(
    "/today",
    status_code=status.HTTP_200_OK,
    summary="Get today's daily challenge",
)
async def get_today_challenge(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        challenge = await challenge_service.get_or_create_daily_challenge(db, user_id)
        return challenge
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

@router.post(
    "/verify",
    status_code=status.HTTP_200_OK,
    summary="Verify challenge completion with a session",
)
async def verify_challenge(
    payload: ChallengeVerifyIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        session_uuid = uuid.UUID(payload.session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session_id format")

    # Fetch session
    result = await db.execute(
        select(EmotionSession).where(
            EmotionSession.id == session_uuid,
            EmotionSession.user_id == uuid.UUID(user_id)
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    try:
        challenge = await challenge_service.verify_challenge_completion(db, user_id, session)
        if not challenge:
            return {
                "success": False,
                "message": "Session does not meet the daily challenge requirements."
            }
        
        # Save modifications to the DB
        await db.commit()
        return {
            "success": True,
            "message": "Daily challenge completed successfully!",
            "challenge": challenge
        }
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

@router.get(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Get challenge history",
)
async def get_history(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        total, history = await challenge_service.get_history(db, user_id, page=page, size=size)
        return {
            "total": total,
            "page": page,
            "size": size,
            "items": history
        }
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

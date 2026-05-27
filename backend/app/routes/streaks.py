"""
app/routes/streaks.py

Streak management API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.streak_service import streak_service

router = APIRouter(prefix="/streaks", tags=["Streaks"])

@router.get(
    "/status",
    status_code=status.HTTP_200_OK,
    summary="Get user streak status",
)
async def get_streak_status(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        # Check and handle resets first
        streak = await streak_service.check_reset(db, user_id)
        
        # Commit reset if it happened
        await db.commit()
        
        # Determine if user already practiced today
        practiced_today = False
        if streak.last_practice_date:
            now = datetime.now(timezone.utc)
            practiced_today = streak.last_practice_date.date() == now.date()
            
        return {
            "current_streak": streak.current_streak,
            "longest_streak": streak.longest_streak,
            "last_practice_date": streak.last_practice_date.isoformat() if streak.last_practice_date else None,
            "streak_freezes_used": streak.streak_freezes_used,
            "milestones_achieved": streak.milestones_achieved,
            "practiced_today": practiced_today,
        }
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

@router.post(
    "/freeze",
    status_code=status.HTTP_200_OK,
    summary="Use a streak freeze (Premium feature)",
)
async def use_streak_freeze(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        streak = await streak_service.use_freeze(db, user_id)
        await db.commit()
        return {
            "success": True,
            "message": "Streak freeze applied successfully",
            "streak_freezes_used": streak.streak_freezes_used,
            "last_practice_date": streak.last_practice_date.isoformat() if streak.last_practice_date else None,
        }
    except ValueError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

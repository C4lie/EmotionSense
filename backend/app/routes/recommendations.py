"""
app/routes/recommendations.py

API router for coaching recommendations.
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.models.recommendation import Recommendation as DBRecommendation
from app.models.session import EmotionSession

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


class RecommendationOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    recommendation: str

    model_config = {"from_attributes": True}


async def get_current_user_required(
    current_user_id: Optional[uuid.UUID] = Depends(get_current_user_optional),
) -> uuid.UUID:
    if current_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user_id


@router.get(
    "",
    response_model=List[RecommendationOut],
    status_code=status.HTTP_200_OK,
    summary="Get user recommendations",
    description="Returns all coaching recommendations generated for the user's past sessions.",
)
async def get_user_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_required),
):
    try:
        # Get recommendations belonging to user's sessions
        stmt = (
            select(DBRecommendation)
            .join(EmotionSession, DBRecommendation.session_id == EmotionSession.id)
            .where(EmotionSession.user_id == current_user_id)
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recommendations: {exc}"
        )

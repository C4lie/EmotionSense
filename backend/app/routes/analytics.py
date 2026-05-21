import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.schemas.analytics import DashboardAnalyticsOut
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Helper dependency to enforce authentication
async def get_current_user_required(
    current_user_id: Optional[uuid.UUID] = Depends(get_current_user_optional),
) -> uuid.UUID:
    if current_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required to access analytics.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user_id


@router.get(
    "/dashboard",
    response_model=DashboardAnalyticsOut,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated user analytics",
    description="Calculates mood score, counts, distributions, and daily timelines for charts.",
)
async def get_dashboard_analytics(
    range: int = Query(7, ge=1, le=90, description="Date range in days"),
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_required),
):
    try:
        return await analytics_service.get_dashboard_analytics(
            db, user_id=current_user_id, range_days=range
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate dashboard analytics: {exc}"
        )

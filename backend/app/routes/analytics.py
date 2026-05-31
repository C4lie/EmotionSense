import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.schemas.analytics import DashboardAnalyticsOut, PaginatedSessions, SessionOut
from app.services.analytics_service import analytics_service
from app.services.session_service import session_service

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


@router.get(
    "",
    response_model=DashboardAnalyticsOut,
    status_code=status.HTTP_200_OK,
    summary="Get user analytics",
)
async def get_analytics_root(
    range: int = Query(7, ge=1, le=90, description="Date range in days"),
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_required),
):
    return await get_dashboard_analytics(range=range, db=db, current_user_id=current_user_id)


@router.get(
    "/history",
    response_model=PaginatedSessions,
    status_code=status.HTTP_200_OK,
    summary="Get user analytics history",
)
async def get_analytics_history(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=50, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_required),
):
    try:
        total, sessions = await session_service.get_user_sessions_paginated(
            db, user_id=current_user_id, page=page, size=size
        )
        return PaginatedSessions(
            total=total,
            page=page,
            size=size,
            sessions=[SessionOut.model_validate(s) for s in sessions],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch history: {exc}"
        )

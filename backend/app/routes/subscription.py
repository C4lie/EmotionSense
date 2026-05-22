"""
app/routes/subscription.py

Subscription management API endpoints.

All endpoints require authentication.
Architecture: Route → Service → Model

Endpoints:
  GET  /api/subscription/status    — Get current tier (free/premium)
  POST /api/subscription/activate  — Activate premium (mock, Phase 1)
  POST /api/subscription/cancel    — Cancel premium subscription
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.subscription_service import subscription_service

router = APIRouter(prefix="/subscription", tags=["Subscription"])


@router.get(
    "/status",
    status_code=status.HTTP_200_OK,
    summary="Get subscription status",
    description="Returns the current subscription tier for the authenticated user.",
)
async def get_subscription_status(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns: { is_premium, plan, activated_at, expires_at }
    """
    return await subscription_service.get_status(db, user_id)


@router.post(
    "/activate",
    status_code=status.HTTP_200_OK,
    summary="Activate premium subscription",
    description="Activates the premium plan for the authenticated user (Phase 1: mock activation).",
)
async def activate_premium(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Phase 1: No payment required. Immediately grants premium access.
    Phase 2: This will redirect to Stripe Checkout.
    """
    try:
        return await subscription_service.activate_premium(db, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post(
    "/cancel",
    status_code=status.HTTP_200_OK,
    summary="Cancel premium subscription",
    description="Cancels the premium subscription and reverts the user to the free tier.",
)
async def cancel_premium(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await subscription_service.cancel_premium(db, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

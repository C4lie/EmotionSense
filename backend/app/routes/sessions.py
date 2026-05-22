import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.schemas.analytics import PaginatedSessions, SessionDetailOut, SessionOut, SessionCreate
from app.services.session_service import session_service

router = APIRouter(prefix="/sessions", tags=["Sessions"])

# Helper dependency to enforce authentication
async def get_current_user_required(
    current_user_id: Optional[uuid.UUID] = Depends(get_current_user_optional),
) -> uuid.UUID:
    if current_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required to view sessions.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user_id


@router.post(
    "",
    response_model=SessionDetailOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new emotion session with records",
    description="Saves a complete emotion session along with all its frame records and computes aggregates.",
)
async def create_session(
    session_in: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_required),
):
    try:
        session = await session_service.create_session_with_records(
            db,
            user_id=current_user_id,
            records=session_in.records,
            session_type=session_in.session_type,
            script_text=session_in.script_text
        )
        await db.commit()
        
        # Re-fetch with eager loaded records
        full_session = await session_service.get_session_details(
            db, session_id=session.id, user_id=current_user_id
        )
        if not full_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session could not be retrieved after creation."
            )
        return full_session
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {exc}"
        )


@router.get(
    "",
    response_model=PaginatedSessions,
    status_code=status.HTTP_200_OK,
    summary="Get user's past emotion sessions",
    description="Returns a paginated list of detection sessions for the active user.",
)
async def get_sessions(
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
            detail=f"Failed to fetch sessions: {exc}"
        )


@router.get(
    "/{session_id}",
    response_model=SessionDetailOut,
    status_code=status.HTTP_200_OK,
    summary="Get detailed emotion session",
    description="Returns full session summary along with all frame-by-frame records.",
)
async def get_session_details(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_required),
):
    try:
        session = await session_service.get_session_details(
            db, session_id=session_id, user_id=current_user_id
        )
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied."
            )
        return SessionDetailOut.model_validate(session)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch session details: {exc}"
        )


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete emotion session",
    description="Deletes a specific session and all its associated frame-level records.",
)
async def delete_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_required),
):
    try:
        deleted = await session_service.delete_session(
            db, session_id=session_id, user_id=current_user_id
        )
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied."
            )
        await db.commit()
        return {"success": True, "message": "Session deleted successfully."}
    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {exc}"
        )

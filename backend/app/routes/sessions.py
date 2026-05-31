import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.schemas.analytics import PaginatedSessions, SessionDetailOut, SessionOut, SessionCreate, SessionStartIn, RecordCreate
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


@router.post(
    "/start",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new dynamic session",
)
async def start_session(
    session_in: SessionStartIn,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_required),
):
    try:
        session = await session_service.create_session(
            db,
            user_id=current_user_id,
            session_type=session_in.session_type,
            script_text=session_in.script_text
        )
        await db.commit()
        return session
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start session: {exc}"
        )


@router.post(
    "/{session_id}/frames",
    status_code=status.HTTP_200_OK,
    summary="Log a frame to an active session",
)
async def add_session_frame(
    session_id: uuid.UUID,
    frame_in: RecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_required),
):
    try:
        session = await session_service.get_session_details(db, session_id=session_id, user_id=current_user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied."
            )
        
        from app.schemas.detect import FaceDetectionDetail, BoundingBox
        
        face_detail = FaceDetectionDetail(
            face_index=frame_in.face_index,
            box=BoundingBox(
                x=frame_in.box_x,
                y=frame_in.box_y,
                width=max(1, frame_in.box_w),
                height=max(1, frame_in.box_h)
            ),
            dominant_emotion=frame_in.dominant_emotion,
            confidence=frame_in.confidence,
            emotion_scores={
                "happy": frame_in.happy,
                "sad": frame_in.sad,
                "angry": frame_in.angry,
                "neutral": frame_in.neutral,
                "fear": frame_in.fear,
                "surprise": frame_in.surprise,
                "disgust": frame_in.disgust,
            }
        )
        
        await session_service.add_records(
            db,
            session_id=session_id,
            faces=[face_detail],
            timestamp=frame_in.timestamp
        )
        await db.commit()
        return {"success": True, "message": "Frame record added."}
    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to log frame: {exc}"
        )


class AudioMetricsIn(BaseModel):
    """Audio telemetry data computed by the browser Web Audio API."""
    energy_mean: float = Field(50.0, ge=0.0, le=100.0)
    energy_std: float = Field(10.0, ge=0.0)
    pace_score: float = Field(50.0, ge=0.0, le=100.0)
    hesitation_rate: float = Field(0.2, ge=0.0, le=1.0)
    expressiveness: float = Field(50.0, ge=0.0, le=100.0)
    silence_ratio: float = Field(0.2, ge=0.0, le=1.0)
    window_count: int = Field(1, ge=1)


class SessionCloseIn(BaseModel):
    """Schema to finalize a session with optional audio metrics."""
    audio_metrics: Optional[AudioMetricsIn] = None


class SessionEndIn(BaseModel):
    """Schema to finalize a session via the end alias."""
    session_id: uuid.UUID
    audio_metrics: Optional[AudioMetricsIn] = None


@router.post(
    "/{session_id}/close",
    response_model=SessionDetailOut,
    status_code=status.HTTP_200_OK,
    summary="Close session and generate report",
)
async def close_session(
    session_id: uuid.UUID,
    payload: Optional[SessionCloseIn] = None,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_required),
):
    try:
        session = await session_service.get_session_details(db, session_id=session_id, user_id=current_user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied."
            )
        
        audio_dict = payload.audio_metrics.model_dump() if (payload and payload.audio_metrics) else None
        closed_session = await session_service.close_session(db, session, audio_metrics=audio_dict)
        
        from app.models.analytics import Analytics as DBAnalytics
        from app.models.recommendation import Recommendation as DBRecommendation
        
        conf = closed_session.confidence_score or 50.0
        stab = closed_session.stability_score or 50.0
        eye = closed_session.eye_contact_score or 50.0
        eng = closed_session.speaking_energy or 50.0
        comm = round((conf + stab + eye + eng) / 4.0, 1)
        
        # Check if already has analytics
        from sqlalchemy import select
        existing_analytics = await db.execute(select(DBAnalytics).where(DBAnalytics.session_id == session_id))
        if not existing_analytics.scalar_one_or_none():
            analytics_record = DBAnalytics(
                session_id=session_id,
                confidence_score=conf,
                communication_score=comm,
                eye_contact_score=eye,
                tone_score=eng,
            )
            db.add(analytics_record)
        
        # Check if already has recommendations
        existing_recs = await db.execute(select(DBRecommendation).where(DBRecommendation.session_id == session_id))
        if not existing_recs.scalars().all():
            tips = []
            if eye < 65:
                tips.append("Your eye-contact focus dropped. Try to glance less at keyboard/notes and look into the camera lens.")
            if eng < 40:
                tips.append("Your energy index was low. Project your voice louder and express emotion to avoid sounding monotone.")
            if stab < 50:
                tips.append("High volatility detected. Try speaking in longer, complete thoughts to stabilize your emotional spikes.")
            
            # Add voice/tone suggestions
            if audio_dict:
                voice_pace = audio_dict.get("pace_score", 50.0)
                voice_hesitation = audio_dict.get("hesitation_rate", 0.2)
                if voice_pace > 75:
                    tips.append("Your speaking pace is a bit fast. Try to pause between key sentences to let your points sink in.")
                elif voice_pace < 35:
                    tips.append("Your speaking pace is slow. Try to speak with a more fluent rhythm to engage your listener.")
                if voice_hesitation > 0.35:
                    tips.append("Frequent hesitation pauses detected. Try to structure your thoughts beforehand to minimize 'um' and 'ah' fillers.")
            
            if not tips:
                tips.append("Excellent posture and expression! Keep maintaining direct eye contact.")
                
            for tip in tips:
                rec = DBRecommendation(
                    session_id=session_id,
                    recommendation=tip
                )
                db.add(rec)
            
        await db.commit()
        
        refetched = await session_service.get_session_details(db, session_id=session_id, user_id=current_user_id)
        return refetched
    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to close session: {exc}"
        )


@router.post(
    "/end",
    response_model=SessionDetailOut,
    status_code=status.HTTP_200_OK,
    summary="End session alias",
)
async def end_session(
    end_in: SessionEndIn,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_required),
):
    close_payload = SessionCloseIn(audio_metrics=end_in.audio_metrics)
    return await close_session(session_id=end_in.session_id, payload=close_payload, db=db, current_user_id=current_user_id)

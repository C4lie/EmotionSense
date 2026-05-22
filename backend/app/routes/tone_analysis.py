"""
app/routes/tone_analysis.py

AI Tone Coaching API endpoints. PREMIUM ONLY.

All endpoints require:
  1. Valid JWT authentication
  2. Active premium subscription (enforced via check_premium_access)

Endpoints:
  POST /api/tone/analyze    — Analyze tone telemetry, generate coaching report
  GET  /api/tone/history    — Paginated list of past reports
  GET  /api/tone/{id}       — Full detail of one report
"""

from datetime import timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import check_premium_access, get_current_user_id
from app.services.tone_service import tone_service

router = APIRouter(prefix="/tone", tags=["Tone Coaching (Premium)"])


# ── Request schemas ────────────────────────────────────────────────────────────

class AudioMetricsIn(BaseModel):
    """Audio telemetry data computed by the browser Web Audio API."""

    energy_mean: float = Field(50.0, ge=0.0, le=100.0)
    energy_std: float = Field(10.0, ge=0.0)
    pace_score: float = Field(50.0, ge=0.0, le=100.0)
    hesitation_rate: float = Field(0.2, ge=0.0, le=1.0)
    expressiveness: float = Field(50.0, ge=0.0, le=100.0)
    silence_ratio: float = Field(0.2, ge=0.0, le=1.0)
    window_count: int = Field(1, ge=1)


class EmotionRecordIn(BaseModel):
    """Simplified emotion record from the face detection engine."""

    dominant_emotion: str
    confidence: float
    happy: float = 0.0
    sad: float = 0.0
    angry: float = 0.0
    neutral: float = 0.0
    fear: float = 0.0
    surprise: float = 0.0
    disgust: float = 0.0


class ToneAnalysisCreate(BaseModel):
    """Full payload for a tone analysis request."""

    audio_metrics: AudioMetricsIn
    emotion_records: List[EmotionRecordIn] = Field(default_factory=list)
    session_id: Optional[str] = None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post(
    "/analyze",
    status_code=status.HTTP_201_CREATED,
    summary="Analyze tone and generate coaching report (Premium)",
)
async def analyze_tone(
    payload: ToneAnalysisCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Accepts audio telemetry + optional emotion records.
    Generates and persists an AI coaching report.
    Returns the full report with recommendations.
    Requires an active premium subscription.
    """
    await check_premium_access(user_id, db)

    audio_dict = payload.audio_metrics.model_dump()
    emotion_list = [r.model_dump() for r in payload.emotion_records]

    report_data = tone_service.generate_report(audio_dict, emotion_list)
    report = await tone_service.save_report(db, user_id, report_data, payload.session_id)

    return {
        "id": str(report.id),
        "overall_score": report.overall_score,
        "tone_score": report.tone_score,
        "delivery_score": report.delivery_score,
        "energy_score": report.energy_score,
        "pace_score": report.pace_score,
        "hesitation_score": report.hesitation_score,
        "consistency_score": report.consistency_score,
        "confidence_score": report.confidence_score,
        "recommendations": report.recommendations,
        "strengths": report.strengths,
        "improvement_areas": report.improvement_areas,
        "raw_audio_metrics": report.raw_audio_metrics,
        "created_at": (report.created_at.replace(tzinfo=timezone.utc).isoformat() if report.created_at.tzinfo is None else report.created_at.isoformat()) if report.created_at else None,
    }


@router.get(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Get tone report history (Premium)",
)
async def get_tone_history(
    page: int = 1,
    size: int = 10,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns paginated list of past tone coaching reports.
    Requires an active premium subscription.
    """
    await check_premium_access(user_id, db)
    return await tone_service.get_history(db, user_id, page, size)


@router.get(
    "/{report_id}",
    status_code=status.HTTP_200_OK,
    summary="Get tone report detail (Premium)",
)
async def get_tone_report(
    report_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the full detail of a single tone coaching report.
    Requires an active premium subscription.
    """
    await check_premium_access(user_id, db)

    report = await tone_service.get_report_detail(db, report_id, user_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found."
        )

    return {
        "id": str(report.id),
        "overall_score": report.overall_score,
        "tone_score": report.tone_score,
        "delivery_score": report.delivery_score,
        "energy_score": report.energy_score,
        "pace_score": report.pace_score,
        "hesitation_score": report.hesitation_score,
        "consistency_score": report.consistency_score,
        "confidence_score": report.confidence_score,
        "recommendations": report.recommendations,
        "strengths": report.strengths,
        "improvement_areas": report.improvement_areas,
        "raw_audio_metrics": report.raw_audio_metrics,
        "created_at": (report.created_at.replace(tzinfo=timezone.utc).isoformat() if report.created_at.tzinfo is None else report.created_at.isoformat()) if report.created_at else None,
    }

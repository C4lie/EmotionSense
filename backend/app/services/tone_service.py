"""
app/services/tone_service.py

AI Tone Coaching engine service.

Processes audio telemetry (from browser Web Audio API) combined with
facial emotion records to generate personalized coaching reports.

All scoring is algorithmic (no external AI API required).
Scores range from 0 to 100.
"""

import uuid
from statistics import mean
from typing import Any, Dict, List, Optional

from sqlalchemy import func as sa_func, select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.tone_report import ToneReport


# ── Coaching recommendation templates ─────────────────────────────────────────
_RECOMMENDATIONS = {
    "high_hesitation": (
        "Reduce silent pauses and filler gaps — aim for deliberate pacing "
        "with confident transitions between points."
    ),
    "low_energy": (
        "Increase vocal projection and animation. Varying your volume and "
        "energy keeps audiences engaged."
    ),
    "inconsistent_energy": (
        "Work on consistent vocal delivery. Large energy swings can feel "
        "unpredictable to your audience."
    ),
    "low_pace_consistency": (
        "Practice a steady speaking rhythm. Uneven pacing can distract from your message."
    ),
    "low_expressiveness": (
        "Add vocal variety through pitch shifts and emphatic stress on key words "
        "to make your delivery more compelling."
    ),
    "low_confidence": (
        "Project more confidence by maintaining steady eye contact with the camera "
        "and reducing nervous expressions."
    ),
    "low_stability": (
        "Keep your emotional expression consistent. Frequent shifts between emotions "
        "can appear uncertain to listeners."
    ),
    "excellent_overall": (
        "Outstanding communication delivery. Continue practicing to maintain "
        "this level of clarity and confidence."
    ),
    "good_overall": (
        "Strong performance overall. Focus on the improvement areas below to reach the next level."
    ),
    "needs_work": (
        "Your delivery has room for improvement. Focus on the specific areas highlighted below "
        "— consistent practice brings rapid gains."
    ),
}

_STRENGTHS_TEMPLATES = {
    "high_energy": "Strong vocal energy and enthusiastic delivery.",
    "consistent_energy": "Very consistent and controlled vocal projection.",
    "high_pace": "Excellent speaking rhythm and pacing.",
    "high_expressiveness": "Highly expressive delivery with great vocal variety.",
    "high_confidence": "Confident presence and strong camera engagement.",
    "high_stability": "Emotionally stable and composed throughout the session.",
    "low_hesitation": "Fluent delivery with minimal hesitation or pauses.",
}


class ToneService:
    """
    Generates tone coaching reports from audio telemetry + facial emotion data.
    """

    def generate_report(
        self, audio_metrics: Dict[str, Any], emotion_records: List[Dict]
    ) -> Dict[str, Any]:
        """
        Core scoring engine. Accepts:
          - audio_metrics: { energy_mean, energy_std, pace_score, hesitation_rate,
                             expressiveness, silence_ratio, window_count }
          - emotion_records: list of { dominant_emotion, confidence, happy, fear, ... }

        Returns a full coaching report dict.
        """
        # ── 1. Extract audio scores ──────────────────────────────────────────
        energy_mean = float(audio_metrics.get("energy_mean", 50.0))
        energy_std = float(audio_metrics.get("energy_std", 10.0))
        pace_raw = float(audio_metrics.get("pace_score", 50.0))
        hesitation_rate = float(audio_metrics.get("hesitation_rate", 0.2))
        expressiveness_raw = float(audio_metrics.get("expressiveness", 50.0))

        # ── 2. Normalize to 0-100 scores ──────────────────────────────────────
        energy_score = min(100.0, max(0.0, energy_mean))
        consistency_score = max(0.0, min(100.0, 100.0 - (energy_std * 2.0)))
        pace_score = min(100.0, max(0.0, pace_raw))
        hesitation_score = max(0.0, min(100.0, (1.0 - hesitation_rate) * 100.0))
        expressiveness_score = min(100.0, max(0.0, expressiveness_raw))

        # ── 3. Facial emotion confidence score ────────────────────────────────
        if emotion_records:
            avg_happy = mean(r.get("happy", 0) for r in emotion_records)
            avg_fear = mean(r.get("fear", 0) for r in emotion_records)
            avg_sad = mean(r.get("sad", 0) for r in emotion_records)
            avg_neutral = mean(r.get("neutral", 0) for r in emotion_records)

            positives = avg_happy * 1.2 + avg_neutral * 0.8
            negatives = avg_fear * 1.5 + avg_sad * 1.0
            confidence_score = max(5.0, min(100.0, 50.0 + positives - negatives))

            # Stability from emotion transitions
            transitions = sum(
                1
                for i in range(1, len(emotion_records))
                if emotion_records[i].get("dominant_emotion")
                != emotion_records[i - 1].get("dominant_emotion")
            )
            volatility = (
                transitions / len(emotion_records) if len(emotion_records) > 1 else 0.0
            )
            face_stability = max(10.0, min(100.0, 100.0 - (volatility * 200.0)))
        else:
            confidence_score = 50.0
            face_stability = 50.0

        # ── 4. Composite scores ──────────────────────────────────────────────
        tone_score = round(
            energy_score * 0.4 + consistency_score * 0.3 + expressiveness_score * 0.3, 1
        )
        delivery_score = round(
            hesitation_score * 0.5 + pace_score * 0.3 + face_stability * 0.2, 1
        )
        overall_score = round(
            confidence_score * 0.35 + tone_score * 0.35 + delivery_score * 0.30, 1
        )

        # ── 5. Recommendations engine ────────────────────────────────────────
        recommendations: List[str] = []
        strengths: List[str] = []
        improvement_areas: List[str] = []

        if overall_score >= 80:
            recommendations.append(_RECOMMENDATIONS["excellent_overall"])
        elif overall_score >= 60:
            recommendations.append(_RECOMMENDATIONS["good_overall"])
        else:
            recommendations.append(_RECOMMENDATIONS["needs_work"])

        if hesitation_rate > 0.35:
            recommendations.append(_RECOMMENDATIONS["high_hesitation"])
            improvement_areas.append("Hesitation & Pausing")
        else:
            strengths.append(_STRENGTHS_TEMPLATES["low_hesitation"])

        if energy_score < 40:
            recommendations.append(_RECOMMENDATIONS["low_energy"])
            improvement_areas.append("Vocal Energy")
        else:
            strengths.append(_STRENGTHS_TEMPLATES["high_energy"])

        if energy_std > 30:
            recommendations.append(_RECOMMENDATIONS["inconsistent_energy"])
            improvement_areas.append("Energy Consistency")
        elif consistency_score >= 70:
            strengths.append(_STRENGTHS_TEMPLATES["consistent_energy"])

        if pace_score < 50:
            recommendations.append(_RECOMMENDATIONS["low_pace_consistency"])
            improvement_areas.append("Speaking Pace")
        else:
            strengths.append(_STRENGTHS_TEMPLATES["high_pace"])

        if expressiveness_score < 40:
            recommendations.append(_RECOMMENDATIONS["low_expressiveness"])
            improvement_areas.append("Vocal Expressiveness")
        else:
            strengths.append(_STRENGTHS_TEMPLATES["high_expressiveness"])

        if confidence_score < 50:
            recommendations.append(_RECOMMENDATIONS["low_confidence"])
            improvement_areas.append("Confidence & Presence")
        else:
            strengths.append(_STRENGTHS_TEMPLATES["high_confidence"])

        if face_stability < 50:
            recommendations.append(_RECOMMENDATIONS["low_stability"])
            improvement_areas.append("Emotional Stability")
        else:
            strengths.append(_STRENGTHS_TEMPLATES["high_stability"])

        logger.info(
            f"[ToneService] Report generated: overall={overall_score} "
            f"tone={tone_score} delivery={delivery_score} confidence={confidence_score:.1f}"
        )

        return {
            "overall_score": overall_score,
            "tone_score": tone_score,
            "delivery_score": delivery_score,
            "energy_score": round(energy_score, 1),
            "pace_score": round(pace_score, 1),
            "hesitation_score": round(hesitation_score, 1),
            "consistency_score": round(consistency_score, 1),
            "confidence_score": round(confidence_score, 1),
            "recommendations": recommendations,
            "strengths": strengths,
            "improvement_areas": improvement_areas,
            "raw_audio_metrics": audio_metrics,
        }

    async def save_report(
        self,
        db: AsyncSession,
        user_id: str,
        report_data: Dict,
        session_id: Optional[str] = None,
    ) -> ToneReport:
        """Persist a generated tone report to the database."""
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            raise ValueError("Invalid user_id")

        session_uuid = None
        if session_id:
            try:
                session_uuid = uuid.UUID(session_id)
            except ValueError:
                pass

        report = ToneReport(
            user_id=uid,
            session_id=session_uuid,
            overall_score=report_data["overall_score"],
            tone_score=report_data["tone_score"],
            delivery_score=report_data["delivery_score"],
            energy_score=report_data["energy_score"],
            pace_score=report_data["pace_score"],
            hesitation_score=report_data["hesitation_score"],
            consistency_score=report_data["consistency_score"],
            confidence_score=report_data["confidence_score"],
            recommendations=report_data["recommendations"],
            strengths=report_data["strengths"],
            improvement_areas=report_data["improvement_areas"],
            raw_audio_metrics=report_data["raw_audio_metrics"],
        )
        db.add(report)
        await db.flush()
        await db.refresh(report)
        return report

    async def get_history(
        self, db: AsyncSession, user_id: str, page: int = 1, size: int = 10
    ) -> Dict:
        """Get paginated tone report history for a user."""
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            return {"total": 0, "page": page, "size": size, "reports": []}

        count_result = await db.execute(
            select(sa_func.count()).select_from(ToneReport).where(ToneReport.user_id == uid)
        )
        total = count_result.scalar_one()

        offset = (page - 1) * size
        result = await db.execute(
            select(ToneReport)
            .where(ToneReport.user_id == uid)
            .order_by(ToneReport.created_at.desc())
            .offset(offset)
            .limit(size)
        )
        reports = result.scalars().all()

        return {
            "total": total,
            "page": page,
            "size": size,
            "reports": [
                {
                    "id": str(r.id),
                    "overall_score": r.overall_score,
                    "tone_score": r.tone_score,
                    "delivery_score": r.delivery_score,
                    "confidence_score": r.confidence_score,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in reports
            ],
        }

    async def get_report_detail(
        self, db: AsyncSession, report_id: str, user_id: str
    ) -> Optional[ToneReport]:
        """Get full detail of a single tone report."""
        try:
            rid = uuid.UUID(report_id)
            uid = uuid.UUID(user_id)
        except ValueError:
            return None

        result = await db.execute(
            select(ToneReport)
            .where(ToneReport.id == rid)
            .where(ToneReport.user_id == uid)
        )
        return result.scalar_one_or_none()


# Singleton instance
tone_service = ToneService()

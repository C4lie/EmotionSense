import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import EmotionSession
from app.models.record import EmotionRecord
from app.schemas.analytics import DashboardAnalyticsOut, EmotionDistribution, MoodTimelinePoint

class AnalyticsService:
    async def get_dashboard_analytics(
        self, db: AsyncSession, user_id: uuid.UUID, range_days: int = 7
    ) -> DashboardAnalyticsOut:
        """
        Calculates and aggregates dashboard stats for a user over the specified past range in days.
        """
        # Time boundary (UTC)
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=range_days)

        # ── 1. Fetch Sessions inside the date range ──
        session_stmt = select(EmotionSession).where(
            and_(
                EmotionSession.user_id == user_id,
                EmotionSession.started_at >= cutoff_date
            )
        )
        sessions_res = await db.execute(session_stmt)
        sessions = sessions_res.scalars().all()
        session_ids = [s.id for s in sessions]

        total_sessions = len(sessions)
        if total_sessions == 0 or not session_ids:
            return DashboardAnalyticsOut(
                mood_score=0.0,
                total_sessions=0,
                total_detections=0,
                most_frequent_emotion=None,
                emotion_distribution=EmotionDistribution(),
                mood_timeline=[],
                range_days=range_days
            )

        # ── 2. Query Record Level Stats ──
        # Get count and averages
        record_stmt = select(
            func.count(EmotionRecord.id),
            func.avg(EmotionRecord.happy),
            func.avg(EmotionRecord.sad),
            func.avg(EmotionRecord.angry),
            func.avg(EmotionRecord.neutral),
            func.avg(EmotionRecord.fear),
            func.avg(EmotionRecord.surprise),
            func.avg(EmotionRecord.disgust)
        ).where(EmotionRecord.session_id.in_(session_ids))

        record_res = await db.execute(record_stmt)
        stats = record_res.fetchone()
        
        total_detections = stats[0] if stats and stats[0] else 0

        # Distribution percentages
        distribution = EmotionDistribution()
        if total_detections > 0 and stats:
            distribution.happy = round(float(stats[1] or 0.0), 2)
            distribution.sad = round(float(stats[2] or 0.0), 2)
            distribution.angry = round(float(stats[3] or 0.0), 2)
            distribution.neutral = round(float(stats[4] or 0.0), 2)
            distribution.fear = round(float(stats[5] or 0.0), 2)
            distribution.surprise = round(float(stats[6] or 0.0), 2)
            distribution.disgust = round(float(stats[7] or 0.0), 2)

        # Compute Mood Score (weighted valence positivity index, capped 0-100)
        # Happy (+100), Surprise (+70), Neutral (+50), Sad (+20), Fear (+10), Angry (0), Disgust (0)
        weighted_sum = (
            distribution.happy * 100.0 +
            distribution.surprise * 70.0 +
            distribution.neutral * 50.0 +
            distribution.sad * 20.0 +
            distribution.fear * 10.0
        )
        total_weights = (
            distribution.happy + distribution.sad + distribution.angry +
            distribution.neutral + distribution.fear + distribution.surprise +
            distribution.disgust
        )
        mood_score = round(weighted_sum / total_weights, 2) if total_weights > 0 else 0.0

        # Find most frequent dominant emotion
        freq_stmt = select(
            EmotionRecord.dominant_emotion,
            func.count(EmotionRecord.id)
        ).where(
            EmotionRecord.session_id.in_(session_ids)
        ).group_by(
            EmotionRecord.dominant_emotion
        ).order_by(
            func.count(EmotionRecord.id).desc()
        ).limit(1)

        freq_res = await db.execute(freq_stmt)
        freq_row = freq_res.fetchone()
        most_frequent_emotion = freq_row[0] if freq_row else None

        # ── 3. Build Timeline points grouped by date ──
        # Group by day: we extract date using SQLite or Postgres-friendly cast
        # func.date(EmotionSession.started_at) works for both SQLite and Postgres.
        timeline_stmt = select(
            func.date(EmotionSession.started_at).label("session_date"),
            func.count(EmotionSession.id).label("session_count"),
            func.avg(EmotionSession.average_confidence).label("avg_conf"),
            # We fetch dominant emotion on that day by taking dominant emotion of the sessions
            # For simplicity, let's select the dominant emotion of the day's records or sessions
            EmotionSession.dominant_emotion
        ).where(
            and_(
                EmotionSession.user_id == user_id,
                EmotionSession.started_at >= cutoff_date
            )
        ).group_by(
            func.date(EmotionSession.started_at),
            EmotionSession.dominant_emotion
        ).order_by(
            "session_date"
        )

        timeline_res = await db.execute(timeline_stmt)
        timeline_rows = timeline_res.all()

        # Group duplicate dates (since dominant_emotion group_by splits them)
        timeline_map = {}
        for row in timeline_rows:
            date_str = str(row[0]) # YYYY-MM-DD
            count = int(row[1] or 0)
            conf = float(row[2] or 0.0)
            dom_emotion = row[3] or "neutral"

            if date_str not in timeline_map:
                timeline_map[date_str] = {
                    "count": count,
                    "confidence_sum": conf * count,
                    "emotions": {dom_emotion: count}
                }
            else:
                timeline_map[date_str]["count"] += count
                timeline_map[date_str]["confidence_sum"] += conf * count
                em_map = timeline_map[date_str]["emotions"]
                em_map[dom_emotion] = em_map.get(dom_emotion, 0) + count

        mood_timeline = []
        # Sort keys to ensure chronological order
        for date_str in sorted(timeline_map.keys()):
            data = timeline_map[date_str]
            avg_conf = round(data["confidence_sum"] / data["count"], 2) if data["count"] > 0 else 0.0
            
            # Select most frequent dominant emotion for that date
            date_dominant = max(data["emotions"], key=data["emotions"].get)

            mood_timeline.append(MoodTimelinePoint(
                date=date_str,
                dominant_emotion=date_dominant,
                session_count=data["count"],
                average_confidence=avg_conf
            ))

        return DashboardAnalyticsOut(
            mood_score=mood_score,
            total_sessions=total_sessions,
            total_detections=total_detections,
            most_frequent_emotion=most_frequent_emotion,
            emotion_distribution=distribution,
            mood_timeline=mood_timeline,
            range_days=range_days
        )

analytics_service = AnalyticsService()

"""
app/schemas/analytics.py

Pydantic schemas for analytics dashboard API endpoints.

Covers:
  - Session list/detail responses (paginated)
  - Dashboard aggregated stats
  - Emotion distribution data for charts
"""

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# ─── Session Schemas ──────────────────────────────────────────────────────────

class SessionOut(BaseModel):
    """Summary of a single emotion session, used in paginated list responses."""

    id: uuid.UUID
    dominant_emotion: Optional[str] = None
    average_confidence: Optional[float] = None
    started_at: datetime
    ended_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EmotionRecordOut(BaseModel):
    """Single emotion record within a session detail response."""

    id: uuid.UUID
    timestamp: datetime
    face_index: int
    box_x: int
    box_y: int
    box_w: int
    box_h: int
    dominant_emotion: str
    confidence: float
    happy: float
    sad: float
    angry: float
    neutral: float
    fear: float
    surprise: float
    disgust: float

    model_config = {"from_attributes": True}


class SessionDetailOut(SessionOut):
    """Full session detail with all emotion records."""

    records: List[EmotionRecordOut] = Field(default_factory=list)


class RecordCreate(BaseModel):
    """Schema to capture a single face detection record for session creation."""

    timestamp: datetime
    face_index: int = Field(default=0, ge=0)
    box_x: int
    box_y: int
    box_w: int
    box_h: int
    dominant_emotion: str = Field(..., description="Dominant emotion detected")
    confidence: float = Field(..., ge=0.0, le=100.0)
    happy: float = Field(0.0, ge=0.0, le=100.0)
    sad: float = Field(0.0, ge=0.0, le=100.0)
    angry: float = Field(0.0, ge=0.0, le=100.0)
    neutral: float = Field(0.0, ge=0.0, le=100.0)
    fear: float = Field(0.0, ge=0.0, le=100.0)
    surprise: float = Field(0.0, ge=0.0, le=100.0)
    disgust: float = Field(0.0, ge=0.0, le=100.0)


class SessionCreate(BaseModel):
    """Schema to create a new session along with its frame records."""

    records: List[RecordCreate] = Field(default_factory=list)


class PaginatedSessions(BaseModel):
    """Paginated response for session list."""

    total: int
    page: int
    size: int
    sessions: List[SessionOut]


# ─── Dashboard Analytics Schemas ──────────────────────────────────────────────

class EmotionDistribution(BaseModel):
    """Emotion distribution as percentages — used for pie/bar charts."""

    happy: float = 0.0
    sad: float = 0.0
    angry: float = 0.0
    neutral: float = 0.0
    fear: float = 0.0
    surprise: float = 0.0
    disgust: float = 0.0


class MoodTimelinePoint(BaseModel):
    """Single data point on the mood timeline chart."""

    date: str = Field(..., description="ISO date string, e.g. '2026-01-15'")
    dominant_emotion: str
    session_count: int
    average_confidence: float


class DashboardAnalyticsOut(BaseModel):
    """
    Aggregated analytics data for the dashboard.

    mood_score: Overall positivity index (0-100) based on weighted emotion frequencies.
    """

    mood_score: float = Field(0.0, ge=0.0, le=100.0)
    total_sessions: int = 0
    total_detections: int = 0
    most_frequent_emotion: Optional[str] = None
    emotion_distribution: EmotionDistribution = Field(default_factory=EmotionDistribution)
    mood_timeline: List[MoodTimelinePoint] = Field(default_factory=list)
    range_days: int = 7

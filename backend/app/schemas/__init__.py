"""
app/schemas/__init__.py

Schemas package. Re-exports all schemas for clean imports.
"""

from app.schemas.auth import UserCreate, UserLogin, UserOut, TokenOut
from app.schemas.detect import (
    BoundingBox,
    FaceDetectionDetail,
    ImageDetectionResponse,
    VideoAnalysisResponse,
    VideoTimelineEntry,
)
from app.schemas.analytics import (
    SessionOut,
    SessionDetailOut,
    EmotionRecordOut,
    PaginatedSessions,
    DashboardAnalyticsOut,
    EmotionDistribution,
    MoodTimelinePoint,
)

__all__ = [
    "UserCreate", "UserLogin", "UserOut", "TokenOut",
    "BoundingBox", "FaceDetectionDetail", "ImageDetectionResponse",
    "VideoAnalysisResponse", "VideoTimelineEntry",
    "SessionOut", "SessionDetailOut", "EmotionRecordOut",
    "PaginatedSessions", "DashboardAnalyticsOut",
    "EmotionDistribution", "MoodTimelinePoint",
]

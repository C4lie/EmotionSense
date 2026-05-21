"""
app/schemas/detect.py

Pydantic schemas for emotion detection API endpoints.

These define the contract for:
  - Face detection results returned per frame/image
  - Image upload responses
  - Video analysis responses
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    """Pixel coordinates of a detected face in the source image."""

    x: int = Field(..., ge=0, description="Left edge X coordinate")
    y: int = Field(..., ge=0, description="Top edge Y coordinate")
    width: int = Field(..., gt=0, description="Box width in pixels")
    height: int = Field(..., gt=0, description="Box height in pixels")


class FaceDetectionDetail(BaseModel):
    """
    Complete emotion analysis result for a single detected face.

    face_index is 0-based. If multiple faces are detected in one frame,
    each has a separate FaceDetectionDetail entry.
    """

    face_index: int = Field(..., ge=0, description="Zero-based face index in frame")
    box: BoundingBox
    dominant_emotion: str = Field(..., description="Highest-confidence emotion label")
    confidence: float = Field(..., ge=0.0, le=100.0, description="Confidence % (0-100)")
    emotion_scores: Dict[str, float] = Field(
        ...,
        description="Confidence % for all 7 emotions",
        examples=[{"happy": 97.1, "sad": 0.3, "angry": 0.2, "neutral": 1.5, "fear": 0.4, "surprise": 0.3, "disgust": 0.2}],
    )


class ImageDetectionResponse(BaseModel):
    """Response schema for POST /api/detect/image."""

    success: bool = True
    faces: List[FaceDetectionDetail] = Field(
        default_factory=list,
        description="List of detected faces with emotion predictions",
    )
    face_count: int = Field(0, description="Total number of faces detected")
    processing_time_ms: float = Field(..., description="Server-side processing time in ms")


class VideoTimelineEntry(BaseModel):
    """Single point in the video emotion timeline."""

    timestamp_seconds: float
    dominant_emotion: str
    confidence: float
    emotion_scores: Dict[str, float]


class VideoAnalysisResponse(BaseModel):
    """Response schema for POST /api/detect/video."""

    success: bool = True
    session_id: Optional[uuid.UUID] = None
    dominant_emotion: Optional[str] = None
    average_confidence: Optional[float] = None
    timeline: List[VideoTimelineEntry] = Field(default_factory=list)
    processing_time_ms: float

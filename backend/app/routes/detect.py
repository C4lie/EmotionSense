"""
app/routes/detect.py

Emotion detection API routes.

Endpoints:
  POST /api/detect/image  — Single image upload → emotion analysis
  POST /api/detect/video  — Video file upload → frame-by-frame analysis
  GET  /api/detect/status — AI model health/readiness check

Architecture:
  Routes are thin. All AI logic is in EmotionService.
  All DB persistence is in SessionService.
  Routes only: parse inputs, delegate to services, format responses.
"""

import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.models.user import User
from app.schemas.detect import ImageDetectionResponse, VideoAnalysisResponse, VideoTimelineEntry
from app.services.emotion_service import emotion_service
from app.services.session_service import session_service
from app.utils.image import bytes_to_bgr_array, validate_image_bytes

router = APIRouter(prefix="/detect", tags=["Detection"])

# ─── Allowed Video Types ──────────────────────────────────────────────────────
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"}
MAX_VIDEO_BYTES = 100 * 1024 * 1024  # 100 MB


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get(
    "/status",
    summary="AI model readiness check",
    description="Returns whether the DeepFace emotion model has been warmed up and is ready.",
    response_description="Model readiness status",
)
async def get_model_status():
    """
    AI model health/readiness endpoint.

    Used by:
      - Frontend to decide when to enable the detection UI
      - Load balancers / deployment health checks
      - Developers during setup to confirm AI pipeline is live
    """
    return {
        "model_ready": emotion_service.is_ready,
        "status": "ready" if emotion_service.is_ready else "warming_up",
        "message": (
            "Emotion model is loaded and ready for inference."
            if emotion_service.is_ready
            else "Model is loading. Please retry in a few seconds."
        ),
    }


@router.post(
    "/image",
    response_model=ImageDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect emotions in a single image",
    description=(
        "Upload a JPEG, PNG, or WEBP image. The server detects all faces using OpenCV, "
        "runs DeepFace emotion analysis on each face ROI, and returns bounding boxes "
        "with emotion confidence scores. Auth is optional — unauthenticated requests "
        "are processed but not persisted to a user account."
    ),
)
async def detect_image(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, or WEBP, max 10MB)"),
    persist: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user_id: Optional[uuid.UUID] = Depends(get_current_user_optional),
):
    """
    Single-image emotion detection endpoint.

    Flow:
      1. Validate file size and MIME type
      2. Decode bytes → BGR numpy array (OpenCV format)
      3. Run emotion_service.analyze_frame() → list of FaceDetectionDetail
      4. If user is authenticated and persist is True → create session, persist records, close session
      5. Return structured response with bounding boxes + emotion scores
    """
    t_start = time.perf_counter()

    # ── 1. Validate input ──────────────────────────────────────────
    image_bytes = await file.read()
    content_type = file.content_type or "application/octet-stream"

    try:
        validate_image_bytes(image_bytes, content_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # ── 2. Decode image ────────────────────────────────────────────
    try:
        frame = bytes_to_bgr_array(image_bytes)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not decode image: {exc}",
        )

    # ── 3. Run AI inference ────────────────────────────────────────
    try:
        faces = emotion_service.analyze_frame(frame)
    except Exception as exc:
        logger.exception(f"[Detect] Inference error on image upload: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI inference failed. Please try again with a different image.",
        )

    processing_time_ms = (time.perf_counter() - t_start) * 1000
    logger.info(
        f"[Detect] /image -> {len(faces)} face(s) detected in {processing_time_ms:.1f}ms "
        f"(user={'guest' if not current_user_id else str(current_user_id)})"
    )

    # ── 4. Persist results (authenticated users only) ──────────────
    if persist and current_user_id and faces:
        # Resolve full User object from the injected db session
        result = await db.execute(select(User).where(User.id == current_user_id))
        current_user = result.scalar_one_or_none()
        if current_user:
            try:
                sess = await session_service.create_session(db, user_id=current_user.id)
                await session_service.add_records(db, sess.id, faces)
                await session_service.close_session(db, sess)
                await db.commit()
                logger.debug(f"[Detect] Session {sess.id} persisted for user {current_user.email}")
            except Exception as exc:
                logger.warning(f"[Detect] Failed to persist session: {exc}")
                await db.rollback()

    # ── 5. Return response ─────────────────────────────────────────
    return ImageDetectionResponse(
        success=True,
        faces=faces,
        face_count=len(faces),
        processing_time_ms=round(processing_time_ms, 2),
    )


@router.post(
    "/video",
    response_model=VideoAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect emotions in a video file",
    description=(
        "Upload an MP4, WEBM, or MOV video. The server samples frames at 2 FPS, "
        "runs emotion detection on each sampled frame, and returns a full timeline "
        "of emotion changes. Requires authentication — results are persisted to a session."
    ),
)
async def detect_video(
    file: UploadFile = File(..., description="Video file (MP4, WEBM, MOV, max 100MB)"),
    db: AsyncSession = Depends(get_db),
    current_user_id: Optional[uuid.UUID] = Depends(get_current_user_optional),
):
    """
    Video file emotion analysis endpoint.

    Flow:
      1. Validate video file size and type
      2. Write bytes to in-memory buffer (OpenCV VideoCapture)
      3. Sample frames at 2 FPS intervals
      4. Run emotion analysis on each sampled frame
      5. Aggregate timeline + dominant emotion
      6. If authenticated → persist session + all records
      7. Return timeline, dominant emotion, and processing stats
    """
    import tempfile
    import os
    import cv2

    t_start = time.perf_counter()

    # ── 1. Validate ────────────────────────────────────────────────
    content_type = file.content_type or "application/octet-stream"
    video_bytes = await file.read()

    if len(video_bytes) > MAX_VIDEO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Video exceeds 100MB limit. Received {len(video_bytes) / (1024*1024):.1f}MB.",
        )

    if content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{content_type}'. Use MP4, WEBM, MOV, or AVI.",
        )

    # ── 2. Write to temp file (OpenCV requires a file path) ────────
    suffix = ".mp4" if "mp4" in content_type else ".webm"
    tmp_path = None
    timeline: list[VideoTimelineEntry] = []
    all_faces = []

    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        # ── 3. Sample frames ───────────────────────────────────────
        cap = cv2.VideoCapture(tmp_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        sample_every_n = max(1, int(fps / 2))  # Sample at ~2 FPS
        frame_idx = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_every_n == 0:
                timestamp_sec = frame_idx / fps
                faces = emotion_service.analyze_frame(frame)

                if faces:
                    # Use the most prominent face (highest confidence) for timeline
                    best_face = max(faces, key=lambda f: f.confidence)
                    timeline.append(VideoTimelineEntry(
                        timestamp_seconds=round(timestamp_sec, 2),
                        dominant_emotion=best_face.dominant_emotion,
                        confidence=best_face.confidence,
                        emotion_scores=best_face.emotion_scores,
                    ))
                    all_faces.extend(faces)

            frame_idx += 1

        cap.release()

    except Exception as exc:
        logger.exception(f"[Detect] Video processing error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Video processing failed. Ensure the video is a valid, non-corrupted file.",
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    processing_time_ms = (time.perf_counter() - t_start) * 1000

    # ── 4. Compute summary ─────────────────────────────────────────
    dominant_emotion = None
    average_confidence = None
    session_id = None

    if timeline:
        # Dominant: most frequent across all timeline entries
        emotion_counts: dict = {}
        for entry in timeline:
            emotion_counts[entry.dominant_emotion] = emotion_counts.get(entry.dominant_emotion, 0) + 1
        dominant_emotion = max(emotion_counts, key=emotion_counts.get)
        average_confidence = round(sum(e.confidence for e in timeline) / len(timeline), 2)

    logger.info(
        f"[Detect] /video -> {len(timeline)} sampled frames, "
        f"dominant={dominant_emotion}, "
        f"time={processing_time_ms:.0f}ms"
    )

    # ── 5. Persist session (authenticated users) ─────────────────────────
    if current_user_id and all_faces:
        # Resolve full User from injected db
        result = await db.execute(select(User).where(User.id == current_user_id))
        current_user = result.scalar_one_or_none()
        if current_user:
            try:
                from datetime import timezone
                sess = await session_service.create_session(db, user_id=current_user.id)

                # Persist records for each timeline entry
                for entry in timeline:
                    matching_faces = [
                        f for f in all_faces
                        if f.dominant_emotion == entry.dominant_emotion
                    ][:1]
                    if matching_faces:
                        from datetime import datetime
                        ts = datetime.now(timezone.utc)
                        await session_service.add_records(db, sess.id, matching_faces, timestamp=ts)

                await session_service.close_session(db, sess)
                await db.commit()
                session_id = sess.id
                logger.debug(f"[Detect] Video session {sess.id} persisted for user {current_user.email}")
            except Exception as exc:
                logger.warning(f"[Detect] Failed to persist video session: {exc}")
                await db.rollback()

    return VideoAnalysisResponse(
        success=True,
        session_id=session_id,
        dominant_emotion=dominant_emotion,
        average_confidence=average_confidence,
        timeline=timeline,
        processing_time_ms=round(processing_time_ms, 2),
    )

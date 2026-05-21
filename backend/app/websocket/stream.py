"""
app/websocket/stream.py

WebSocket real-time emotion detection stream handler.

This is the core of the real-time detection feature (Phase 7).
The handler accepts base64-encoded frames from the frontend,
runs emotion detection on each frame, and streams results back.

Protocol:
  - Client sends: {"image": "<base64_jpeg>", "timestamp": "<ISO8601>"}
  - Server sends: {"faces": [...], "face_count": N, "processing_time_ms": X}
  - On error:     {"error": true, "message": "..."}

Security:
  - JWT token validated on connect (as query param: ?token=<JWT>)
  - Unauthenticated connections are accepted but not persisted
  - Invalid tokens are rejected immediately on handshake

Session Lifecycle:
  1. On connect: Create EmotionSession in DB (if authenticated)
  2. On each frame: detect faces, persist EmotionRecord, send results
  3. On disconnect: Close session, compute aggregate stats
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect
from loguru import logger

from app.core.security import decode_access_token
from app.services.emotion_service import emotion_service
from app.services.session_service import session_service
from app.utils.image import decode_base64_image
from app.websocket.connection import connection_manager


async def handle_stream(
    websocket: WebSocket,
    token: Optional[str] = None,
    db=None,
) -> None:
    """
    Main WebSocket stream handler.

    Called by the /ws/detect WebSocket route.

    Args:
        websocket: The active WebSocket connection.
        token: Optional JWT token from query params for auth.
        db: Async database session (injected by route).
    """
    session_id = str(uuid.uuid4())

    # ── Authenticate (optional) ──────────────────────────────────────────────
    current_user_id: Optional[uuid.UUID] = None
    if token:
        try:
            payload = decode_access_token(token)
            user_id_str = payload.get("sub")
            if user_id_str:
                current_user_id = uuid.UUID(user_id_str)
                logger.info(f"[WS] Authenticated stream: user={current_user_id} session={session_id}")
        except Exception:
            await websocket.close(code=4001, reason="Invalid authentication token")
            return

    # ── Accept WebSocket ─────────────────────────────────────────────────────
    await connection_manager.connect(session_id, websocket)

    # ── Create Session in DB ─────────────────────────────────────────────────
    db_session = None
    if db and current_user_id:
        try:
            db_session = await session_service.create_session(db, user_id=current_user_id)
            await db.flush()
            logger.info(f"[WS] Session {db_session.id} created for user {current_user_id}")
        except Exception as exc:
            logger.warning(f"[WS] Failed to create DB session: {exc}")
            db_session = None

    # ── Frame Processing Loop ────────────────────────────────────────────────
    try:
        while True:
            # Receive raw message
            raw = await websocket.receive_text()

            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                await connection_manager.send_error(session_id, "Invalid JSON payload")
                continue

            b64_image = payload.get("image")
            if not b64_image:
                await connection_manager.send_error(session_id, "Missing 'image' field in payload")
                continue

            # Decode base64 frame
            try:
                frame = decode_base64_image(b64_image)
            except ValueError as exc:
                await connection_manager.send_error(session_id, f"Image decode failed: {exc}")
                continue

            # Run emotion detection
            import time
            t0 = time.perf_counter()
            try:
                faces = emotion_service.analyze_frame(frame)
            except Exception as exc:
                logger.warning(f"[WS] Inference error: {exc}")
                await connection_manager.send_error(session_id, "Inference failed for this frame")
                continue

            processing_ms = round((time.perf_counter() - t0) * 1000, 1)

            # Persist to DB if authenticated
            if db_session and db and faces:
                try:
                    ts = datetime.now(timezone.utc)
                    if payload.get("timestamp"):
                        try:
                            ts = datetime.fromisoformat(payload["timestamp"])
                        except ValueError:
                            pass
                    await session_service.add_records(db, db_session.id, faces, timestamp=ts)
                    await db.flush()
                except Exception as exc:
                    logger.debug(f"[WS] DB write skipped: {exc}")

            # Build and send response
            response = {
                "faces": [
                    {
                        "face_index": f.face_index,
                        "box": {
                            "x": f.box.x,
                            "y": f.box.y,
                            "width": f.box.width,
                            "height": f.box.height,
                        },
                        "dominant_emotion": f.dominant_emotion,
                        "confidence": f.confidence,
                        "emotion_scores": f.emotion_scores,
                    }
                    for f in faces
                ],
                "face_count": len(faces),
                "processing_time_ms": processing_ms,
            }
            await connection_manager.send_json(session_id, response)

    except WebSocketDisconnect:
        logger.info(f"[WS] Client disconnected: session={session_id}")
    except Exception as exc:
        logger.exception(f"[WS] Unexpected stream error: {exc}")
    finally:
        # ── Close Session ────────────────────────────────────────────────────
        if db_session and db:
            try:
                await session_service.close_session(db, db_session)
                await db.commit()
                logger.info(f"[WS] Session {db_session.id} closed and committed")
            except Exception as exc:
                logger.warning(f"[WS] Failed to close session: {exc}")
                try:
                    await db.rollback()
                except Exception:
                    pass

        connection_manager.disconnect(session_id)

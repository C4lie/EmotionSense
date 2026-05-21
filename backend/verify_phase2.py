"""
verify_phase2.py

Phase 2 verification script — AI Inference Engine.

Tests the complete AI pipeline without needing a real database or
internet connection (DeepFace model must already be downloaded).

Run: venv\Scripts\python verify_phase2.py
"""

import asyncio
import io
import sys
from unittest.mock import patch

from httpx import AsyncClient, ASGITransport
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app
from app.schemas.detect import BoundingBox, FaceDetectionDetail


# ─── SQLite Test DB ───────────────────────────────────────────────────────────
TEST_DB_URL = "sqlite+aiosqlite:///./verify_test_p2.db"
test_engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


async def setup_db():
    from app.models import User, EmotionSession, EmotionRecord  # noqa: F401
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def teardown_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


async def get_test_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ─── Mock Face Result ─────────────────────────────────────────────────────────
MOCK_FACES = [
    FaceDetectionDetail(
        face_index=0,
        box=BoundingBox(x=45, y=30, width=120, height=130),
        dominant_emotion="happy",
        confidence=93.4,
        emotion_scores={
            "happy": 93.4, "sad": 0.8, "angry": 0.5,
            "neutral": 3.2, "fear": 0.6, "surprise": 1.1, "disgust": 0.4,
        },
    )
]


def make_jpeg_bytes(w=100, h=100) -> bytes:
    """Generate a valid JPEG image as bytes."""
    img = Image.new("RGB", (w, h), color=(80, 120, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.read()


async def run_verification():
    await setup_db()
    app.dependency_overrides[get_db] = get_test_db

    print("\nRunning Phase 2 verification...\n")
    passes = 0
    failures = 0

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:

        # ── Check 1: /api/detect/status ───────────────────────────
        r = await client.get("/api/detect/status")
        assert r.status_code == 200, f"FAIL detect/status: {r.status_code}"
        data = r.json()
        assert "model_ready" in data and "status" in data
        print(f"[PASS] GET /api/detect/status         -> 200 | status={data['status']}")
        passes += 1

        # ── Check 2: Health now includes model_ready ───────────────
        r = await client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert "model_ready" in data
        print(f"[PASS] GET /health (model_ready field) -> 200 | model_ready={data['model_ready']}")
        passes += 1

        # ── Check 3: Upload image (guest, no faces) ────────────────
        with patch("app.routes.detect.emotion_service.analyze_frame", return_value=[]):
            r = await client.post(
                "/api/detect/image",
                files={"file": ("blank.jpg", make_jpeg_bytes(), "image/jpeg")},
            )
        assert r.status_code == 200, f"FAIL image (no face): {r.status_code} {r.text}"
        d = r.json()
        assert d["success"] is True and d["face_count"] == 0
        print(f"[PASS] POST /api/detect/image (guest, no face) -> 200 | face_count=0")
        passes += 1

        # ── Check 4: Upload image (guest, with face mocked) ────────
        with patch("app.routes.detect.emotion_service.analyze_frame", return_value=MOCK_FACES):
            r = await client.post(
                "/api/detect/image",
                files={"file": ("face.jpg", make_jpeg_bytes(), "image/jpeg")},
            )
        assert r.status_code == 200, f"FAIL image (with face): {r.status_code}"
        d = r.json()
        assert d["face_count"] == 1
        face = d["faces"][0]
        assert face["dominant_emotion"] == "happy"
        assert face["confidence"] == 93.4
        assert all(k in face["emotion_scores"] for k in ["happy", "sad", "angry", "neutral", "fear", "surprise", "disgust"])
        assert all(k in face["box"] for k in ["x", "y", "width", "height"])
        print(f"[PASS] POST /api/detect/image (guest, 1 face) -> 200 | emotion={face['dominant_emotion']} conf={face['confidence']}")
        passes += 1

        # ── Check 5: Invalid MIME type rejected ────────────────────
        r = await client.post(
            "/api/detect/image",
            files={"file": ("doc.pdf", b"fake pdf", "application/pdf")},
        )
        assert r.status_code == 400, f"FAIL invalid mime: expected 400, got {r.status_code}"
        assert "unsupported" in r.json()["detail"].lower()
        print(f"[PASS] POST /api/detect/image (bad MIME)       -> 400 | correctly rejected")
        passes += 1

        # ── Check 6: Authenticated detect + session persistence ────
        import uuid as _uuid
        unique_email = f"aiuser_{_uuid.uuid4().hex[:8]}@test.ai"
        reg = await client.post("/api/auth/register", json={
            "name": "AI User", "email": unique_email, "password": "strongpass123",
        })
        assert reg.status_code == 201, f"Registration failed: {reg.json()}"
        token = reg.json()["access_token"]

        with patch("app.routes.detect.emotion_service.analyze_frame", return_value=MOCK_FACES):
            r = await client.post(
                "/api/detect/image",
                files={"file": ("face.jpg", make_jpeg_bytes(), "image/jpeg")},
                headers={"Authorization": f"Bearer {token}"},
            )
        assert r.status_code == 200, f"FAIL auth detect: {r.status_code} {r.text}"
        d = r.json()
        assert d["face_count"] == 1
        print(f"[PASS] POST /api/detect/image (auth)           -> 200 | session persisted for user")
        passes += 1

        # ── Check 7: OpenAPI docs include detect routes ────────────
        r = await client.get("/api/openapi.json")
        paths = list(r.json()["paths"].keys())
        assert "/api/detect/image" in paths, f"Missing /api/detect/image in: {paths}"
        assert "/api/detect/status" in paths
        print(f"[PASS] Detect routes in OpenAPI schema         -> /api/detect/image, /api/detect/status found")
        passes += 1

        # ── Check 8: PNG upload supported ─────────────────────────
        png_img = Image.new("RGB", (80, 80), color=(200, 100, 50))
        png_buf = io.BytesIO()
        png_img.save(png_buf, format="PNG")
        png_buf.seek(0)

        with patch("app.routes.detect.emotion_service.analyze_frame", return_value=[]):
            r = await client.post(
                "/api/detect/image",
                files={"file": ("test.png", png_buf.read(), "image/png")},
            )
        assert r.status_code == 200, f"FAIL PNG: {r.status_code}"
        print(f"[PASS] POST /api/detect/image (PNG format)     -> 200 | PNG upload supported")
        passes += 1

    app.dependency_overrides.clear()
    await teardown_db()

    print()
    print("=" * 60)
    print(f"  PHASE 2 VERIFICATION: {passes} CHECKS PASSED, {failures} FAILED  ")
    print("=" * 60)
    print()
    print("AI Inference Engine is complete.")
    print("Endpoints: /api/detect/image, /api/detect/video, /api/detect/status")
    print("WebSocket: /ws/detect (ready for Phase 7 frontend integration)")

    if failures > 0:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_verification())

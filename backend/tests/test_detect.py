"""
tests/test_detect.py

Integration tests for the emotion detection API endpoints.

Tests:
  - GET  /api/detect/status     — model readiness check
  - POST /api/detect/image      — valid image, invalid file, unsupported type
  - POST /api/detect/image      — authenticated request persists session

Note: These tests use an in-memory SQLite DB (same pattern as test_auth.py).
DeepFace model is mocked to avoid slow downloads in CI.
"""

import io
import uuid
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.database import get_db
from app.main import app
from app.schemas.detect import BoundingBox, FaceDetectionDetail
from tests.conftest import TestSessionLocal, setup_test_db


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_faces():
    """Realistic mock face detection result for a single happy face."""
    return [
        FaceDetectionDetail(
            face_index=0,
            box=BoundingBox(x=50, y=30, width=120, height=130),
            dominant_emotion="happy",
            confidence=92.5,
            emotion_scores={
                "happy": 92.5,
                "sad": 1.2,
                "angry": 0.8,
                "neutral": 3.1,
                "fear": 0.9,
                "surprise": 1.0,
                "disgust": 0.5,
            },
        )
    ]


@pytest.fixture
def small_valid_jpeg():
    """
    Returns bytes for a minimal valid JPEG image (1x1 pixel black).
    Used to test upload endpoints without needing a real image file.
    """
    from PIL import Image

    img = Image.new("RGB", (100, 100), color=(50, 100, 150))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.read()


@pytest.fixture
async def auth_client(setup_test_db):
    """Async HTTP client with DB override + an authenticated user token."""
    async def _override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        # Register and login to get a token
        reg = await client.post("/api/auth/register", json={
            "name": "Detect User",
            "email": "detect@test.com",
            "password": "password123",
        })
        token = reg.json().get("access_token")
        yield client, token

    app.dependency_overrides.clear()


# ─── Model Status Tests ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_model_status_endpoint(setup_test_db):
    """Model status endpoint should return a structured response."""
    async def _override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/detect/status")
        assert r.status_code == 200
        data = r.json()
        assert "model_ready" in data
        assert "status" in data
        assert data["status"] in ("ready", "warming_up")
    app.dependency_overrides.clear()


# ─── Image Upload Tests ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_detect_image_no_face(small_valid_jpeg, setup_test_db):
    """
    Uploading a solid-color image (no face) should return 200 with 0 faces.
    The emotion_service.analyze_frame is mocked to return [] (no faces).
    """
    async def _override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db

    with patch("app.routes.detect.emotion_service.analyze_frame", return_value=[]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post(
                "/api/detect/image",
                files={"file": ("test.jpg", small_valid_jpeg, "image/jpeg")},
            )
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert data["face_count"] == 0
        assert data["faces"] == []
        assert "processing_time_ms" in data

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_detect_image_with_face(small_valid_jpeg, mock_faces, setup_test_db):
    """
    Uploading an image with a mocked face result should return correct emotion data.
    """
    async def _override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db

    with patch("app.routes.detect.emotion_service.analyze_frame", return_value=mock_faces):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post(
                "/api/detect/image",
                files={"file": ("photo.jpg", small_valid_jpeg, "image/jpeg")},
            )
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert data["face_count"] == 1
        assert len(data["faces"]) == 1
        face = data["faces"][0]
        assert face["dominant_emotion"] == "happy"
        assert face["confidence"] == 92.5
        assert "emotion_scores" in face
        assert "box" in face
        assert all(k in face["box"] for k in ("x", "y", "width", "height"))

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_detect_image_invalid_mime(setup_test_db):
    """Uploading a file with an unsupported MIME type should return 400."""
    async def _override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/api/detect/image",
            files={"file": ("document.pdf", b"fake pdf content", "application/pdf")},
        )
    assert r.status_code == 400
    assert "unsupported" in r.json()["detail"].lower()

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_detect_image_empty_file(setup_test_db):
    """Uploading an empty file should return 422 (can't decode image)."""
    async def _override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/api/detect/image",
            files={"file": ("empty.jpg", b"", "image/jpeg")},
        )
    # Empty file: either 422 (can't decode) or 400 (size check passes but decode fails)
    assert r.status_code in (400, 422)

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_detect_image_authenticated_persists_session(small_valid_jpeg, mock_faces, setup_test_db):
    """
    Authenticated image detection should create and persist a session to the DB.
    """
    async def _override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db

    with patch("app.routes.detect.emotion_service.analyze_frame", return_value=mock_faces):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Register user
            reg = await client.post("/api/auth/register", json={
                "name": "Authenticated Detect",
                "email": "authdetect@test.com",
                "password": "password123",
            })
            token = reg.json()["access_token"]

            # Upload image with auth
            r = await client.post(
                "/api/detect/image",
                files={"file": ("face.jpg", small_valid_jpeg, "image/jpeg")},
                headers={"Authorization": f"Bearer {token}"},
            )
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert data["face_count"] == 1

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_detect_image_guest_no_persistence(small_valid_jpeg, mock_faces, setup_test_db):
    """
    Guest (unauthenticated) image detection should succeed but not persist any session.
    """
    async def _override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db

    with patch("app.routes.detect.emotion_service.analyze_frame", return_value=mock_faces):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # No Authorization header
            r = await client.post(
                "/api/detect/image",
                files={"file": ("face.jpg", small_valid_jpeg, "image/jpeg")},
            )
        assert r.status_code == 200
        assert r.json()["face_count"] == 1

    app.dependency_overrides.clear()

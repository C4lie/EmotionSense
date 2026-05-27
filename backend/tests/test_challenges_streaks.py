import pytest
from httpx import AsyncClient
import uuid
from app.models.user import User

from app.core.security import hash_password

@pytest.fixture
async def auth_header(client: AsyncClient, db_session) -> dict:
    # Create test user with unique email
    unique_id = uuid.uuid4().hex[:6]
    email = f"test_challenge_{unique_id}@emotionsense.ai"
    test_user = User(
        name="Test User",
        email=email,
        password_hash=hash_password("secure_password"),
        is_premium=True, # premium to allow testing of premium features like streak freeze
    )
    db_session.add(test_user)
    await db_session.commit()

    # Login
    response = await client.post(
        "/api/auth/login",
        json={"email": email, "password": "secure_password"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.anyio
async def test_get_today_challenge(client: AsyncClient, auth_header: dict):
    response = await client.get("/api/challenges/today", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert "description" in data
    assert "target_score" in data
    assert data["completed"] is False

@pytest.mark.anyio
async def test_get_streak_status(client: AsyncClient, auth_header: dict):
    response = await client.get("/api/streaks/status", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert "current_streak" in data
    assert "longest_streak" in data
    assert data["practiced_today"] is False

@pytest.mark.anyio
async def test_use_streak_freeze(client: AsyncClient, auth_header: dict):
    response = await client.post("/api/streaks/freeze", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["streak_freezes_used"] == 1

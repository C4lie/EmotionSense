"""
tests/test_auth.py

Integration tests for authentication API endpoints.

Tests:
  - POST /api/auth/register — success, duplicate email
  - POST /api/auth/login    — success, wrong password, nonexistent email
  - GET  /api/auth/me       — success, no token, invalid token
"""

import pytest
from httpx import AsyncClient


# ─── Registration Tests ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """A new user should be able to register and receive a JWT token."""
    response = await client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepass123",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["name"] == "Test User"
    assert "id" in data["user"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Registering with an already-used email should return 409."""
    payload = {
        "name": "User One",
        "email": "duplicate@example.com",
        "password": "password123",
    }
    # First registration — should succeed
    await client.post("/api/auth/register", json=payload)

    # Second registration with same email — should fail
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient):
    """Registration with a malformed email should return 422."""
    response = await client.post("/api/auth/register", json={
        "name": "User",
        "email": "not-an-email",
        "password": "password123",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_short_password(client: AsyncClient):
    """Password shorter than 8 characters should return 422."""
    response = await client.post("/api/auth/register", json={
        "name": "User",
        "email": "user@example.com",
        "password": "short",
    })
    assert response.status_code == 422


# ─── Login Tests ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Correct credentials should return a valid JWT token."""
    # Register first
    await client.post("/api/auth/register", json={
        "name": "Login User",
        "email": "logintest@example.com",
        "password": "mypassword123",
    })

    # Login
    response = await client.post("/api/auth/login", json={
        "email": "logintest@example.com",
        "password": "mypassword123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "logintest@example.com"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """Wrong password should return 401 with a generic error."""
    await client.post("/api/auth/register", json={
        "name": "User",
        "email": "wrongpass@example.com",
        "password": "correctpassword",
    })
    response = await client.post("/api/auth/login", json={
        "email": "wrongpass@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_email(client: AsyncClient):
    """Login with an email that was never registered should return 401."""
    response = await client.post("/api/auth/login", json={
        "email": "ghost@example.com",
        "password": "somepassword",
    })
    assert response.status_code == 401


# ─── Protected Endpoint Tests ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_me_success(client: AsyncClient):
    """An authenticated user should be able to fetch their own profile."""
    # Register and get token
    reg_response = await client.post("/api/auth/register", json={
        "name": "Me User",
        "email": "meuser@example.com",
        "password": "password123",
    })
    token = reg_response.json()["access_token"]

    # Fetch profile
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "meuser@example.com"


@pytest.mark.asyncio
async def test_get_me_no_token(client: AsyncClient):
    """Accessing /me without a token should return 403."""
    response = await client.get("/api/auth/me")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient):
    """An invalid/tampered token should return 403."""
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer totally.invalid.token"},
    )
    assert response.status_code in (401, 403)


# ─── Health Check ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Health endpoint should always return 200 OK."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

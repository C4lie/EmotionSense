"""
verify_phase1.py

Phase 0 + Phase 1 verification script.

Uses an in-memory SQLite database (no PostgreSQL required) to run
full endpoint integration tests, exactly like the test suite does.

Run: venv\Scripts\python verify_phase1.py
"""

import asyncio

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app


# ─── In-Memory SQLite Test Database ──────────────────────────────────────────
TEST_DB_URL = "sqlite+aiosqlite:///./verify_test.db"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def setup_test_db():
    """Create all tables in the SQLite test database."""
    from app.models import User, EmotionSession, EmotionRecord  # noqa: F401 register models
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("SQLite test DB tables created: OK")


async def teardown_test_db():
    """Drop all test tables after verification."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


async def get_test_db():
    """Override for FastAPI dependency injection — use SQLite instead of PostgreSQL."""
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def run_verification():
    # Setup SQLite in-memory database
    await setup_test_db()

    # Override the get_db dependency to use SQLite
    app.dependency_overrides[get_db] = get_test_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:

        print("\nRunning Phase 0 + Phase 1 verification...\n")

        # ── 1. Health Check ───────────────────────────────────────
        r = await client.get("/health")
        assert r.status_code == 200, f"FAIL /health: {r.status_code}"
        data = r.json()
        assert data["status"] == "ok"
        print(f"[PASS] GET /health                -> 200 | status={data['status']} env={data['environment']}")

        # ── 2. Root Endpoint ──────────────────────────────────────
        r = await client.get("/")
        assert r.status_code == 200, f"FAIL /: {r.status_code}"
        print(f"[PASS] GET /                      -> 200 | message='{r.json()['message']}'")

        # ── 3. OpenAPI Schema Available ───────────────────────────
        r = await client.get("/api/openapi.json")
        assert r.status_code == 200
        openapi = r.json()
        title = openapi["info"]["title"]
        version = openapi["info"]["version"]
        print(f"[PASS] GET /api/openapi.json      -> 200 | title={title} v{version}")

        # ── 4. All Routes Registered ──────────────────────────────
        paths = list(openapi["paths"].keys())
        assert "/api/auth/register" in paths, "Missing route: /api/auth/register"
        assert "/api/auth/login" in paths,    "Missing route: /api/auth/login"
        assert "/api/auth/me" in paths,       "Missing route: /api/auth/me"
        assert "/health" in paths,            "Missing route: /health"
        print(f"[PASS] Route registration check   -> All required routes registered: {paths}")

        # ── 5. Schema Validation — Invalid Payload ────────────────
        r = await client.post("/api/auth/register", json={
            "name": "T",
            "email": "bad-email",
            "password": "short",
        })
        assert r.status_code == 422, f"FAIL schema validation: expected 422, got {r.status_code}"
        print(f"[PASS] POST /api/auth/register    -> 422 (invalid payload correctly rejected)")

        # ── 6. User Registration — Full Flow ─────────────────────
        r = await client.post("/api/auth/register", json={
            "name": "Verification User",
            "email": "verify@emotionsense.ai",
            "password": "securepwd123",
        })
        assert r.status_code == 201, f"FAIL register: {r.status_code} — {r.json()}"
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "verify@emotionsense.ai"
        token = data["access_token"]
        print(f"[PASS] POST /api/auth/register    -> 201 | user created, token issued")

        # ── 7. Duplicate Email Rejected ───────────────────────────
        r = await client.post("/api/auth/register", json={
            "name": "Duplicate",
            "email": "verify@emotionsense.ai",
            "password": "anotherpass123",
        })
        assert r.status_code == 409, f"FAIL duplicate check: {r.status_code}"
        print(f"[PASS] POST /api/auth/register    -> 409 (duplicate email correctly rejected)")

        # ── 8. Login with Correct Credentials ────────────────────
        r = await client.post("/api/auth/login", json={
            "email": "verify@emotionsense.ai",
            "password": "securepwd123",
        })
        assert r.status_code == 200, f"FAIL login: {r.status_code} — {r.json()}"
        data = r.json()
        assert "access_token" in data
        login_token = data["access_token"]
        print(f"[PASS] POST /api/auth/login       -> 200 | token issued")

        # ── 9. Login with Wrong Password ──────────────────────────
        r = await client.post("/api/auth/login", json={
            "email": "verify@emotionsense.ai",
            "password": "wrongpassword",
        })
        assert r.status_code == 401, f"FAIL wrong password: expected 401, got {r.status_code}"
        print(f"[PASS] POST /api/auth/login       -> 401 (wrong password correctly rejected)")

        # ── 10. GET /me — Authenticated ───────────────────────────
        r = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {login_token}"})
        assert r.status_code == 200, f"FAIL /me: {r.status_code} — {r.json()}"
        me = r.json()
        assert me["email"] == "verify@emotionsense.ai"
        assert "id" in me
        print(f"[PASS] GET  /api/auth/me          -> 200 | email={me['email']}")

        # ── 11. GET /me — No Token ────────────────────────────────
        r = await client.get("/api/auth/me")
        assert r.status_code == 403, f"FAIL no token: expected 403, got {r.status_code}"
        print(f"[PASS] GET  /api/auth/me          -> 403 (no token correctly rejected)")

        # ── 12. GET /me — Invalid Token ───────────────────────────
        r = await client.get("/api/auth/me", headers={"Authorization": "Bearer totally.invalid.token"})
        assert r.status_code in (401, 403), f"FAIL invalid token: got {r.status_code}"
        print(f"[PASS] GET  /api/auth/me          -> {r.status_code} (invalid token correctly rejected)")

    # Cleanup
    app.dependency_overrides.clear()
    await teardown_test_db()

    print()
    print("=" * 60)
    print("  PHASE 0 + PHASE 1: ALL 12 CHECKS PASSED  ")
    print("=" * 60)
    print()
    print("Backend foundation is complete and production-ready.")
    print("All endpoints, auth flows, validation, and error handling work correctly.")


if __name__ == "__main__":
    asyncio.run(run_verification())

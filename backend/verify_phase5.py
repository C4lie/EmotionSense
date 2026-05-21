import asyncio
import sys
import uuid as _uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app
from app.models.session import EmotionSession
from app.models.record import EmotionRecord
from httpx import AsyncClient, ASGITransport

# Use SQLite for local unit/integration test verification
TEST_DB_URL = "sqlite+aiosqlite:///./verify_test_p5.db"
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

async def run_verification():
    print("Setting up SQLite test database...")
    await setup_db()
    
    # Override FastAPI dependency
    app.dependency_overrides[get_db] = get_test_db
    
    print("Running Phase 5 Analytics & Sessions Verification...")
    
    passes = 0
    failures = 0
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        try:
            # 1. Register a test user
            unique_email = f"analyt_user_{_uuid.uuid4().hex[:8]}@test.ai"
            reg = await client.post("/api/auth/register", json={
                "name": "Analytics User", "email": unique_email, "password": "securepassword123"
            })
            assert reg.status_code == 201, f"Registration failed: {reg.json()}"
            token = reg.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("[PASS] User registered successfully.")
            passes += 1
            
            # 2. Check empty analytics and sessions
            an_res = await client.get("/api/analytics/dashboard?range=7", headers=headers)
            assert an_res.status_code == 200, f"Analytics query failed: {an_res.json()}"
            an_data = an_res.json()
            assert an_data["total_sessions"] == 0, f"Expected 0 sessions, got {an_data['total_sessions']}"
            assert an_data["mood_score"] == 0.0, "Expected mood score 0.0"
            
            sess_res = await client.get("/api/sessions", headers=headers)
            assert sess_res.status_code == 200, f"Sessions query failed: {sess_res.json()}"
            assert len(sess_res.json()["sessions"]) == 0, "Expected 0 sessions"
            print("[PASS] Verified initial empty states.")
            passes += 1

            # 3. Create dummy session records by injecting directly via SQLAlchemy session
            user_uuid = _uuid.UUID(reg.json()["user"]["id"])
            
            async with TestSessionLocal() as db:
                # Session 1: Yesterday, 1 neutral record
                sess1 = EmotionSession(
                    user_id=user_uuid,
                    dominant_emotion="neutral",
                    average_confidence=80.0,
                    started_at=datetime.now(timezone.utc) - timedelta(days=1),
                    ended_at=datetime.now(timezone.utc) - timedelta(days=1) + timedelta(minutes=5)
                )
                db.add(sess1)
                await db.flush()
                
                rec1 = EmotionRecord(
                    session_id=sess1.id,
                    timestamp=datetime.now(timezone.utc) - timedelta(days=1),
                    face_index=0,
                    box_x=10, box_y=10, box_w=100, box_h=100,
                    dominant_emotion="neutral",
                    confidence=80.0,
                    happy=10.0, sad=10.0, angry=5.0, neutral=80.0, fear=5.0, surprise=0.0, disgust=0.0
                )
                db.add(rec1)
                
                # Session 2: Today, 1 happy record
                sess2 = EmotionSession(
                    user_id=user_uuid,
                    dominant_emotion="happy",
                    average_confidence=95.0,
                    started_at=datetime.now(timezone.utc),
                    ended_at=datetime.now(timezone.utc) + timedelta(minutes=10)
                )
                db.add(sess2)
                await db.flush()
                
                rec2 = EmotionRecord(
                    session_id=sess2.id,
                    timestamp=datetime.now(timezone.utc),
                    face_index=0,
                    box_x=20, box_y=20, box_w=120, box_h=120,
                    dominant_emotion="happy",
                    confidence=95.0,
                    happy=95.0, sad=0.0, angry=0.0, neutral=5.0, fear=0.0, surprise=0.0, disgust=0.0
                )
                db.add(rec2)
                
                await db.commit()
                
                session_1_id = sess1.id
                session_2_id = sess2.id

            print("[PASS] Manual test session records inserted.")
            passes += 1

            # 4. Check sessions list query
            sess_res = await client.get("/api/sessions", headers=headers)
            assert sess_res.status_code == 200, f"Query failed: {sess_res.json()}"
            sess_data = sess_res.json()
            assert sess_data["total"] == 2, f"Expected 2 sessions, got {sess_data['total']}"
            assert len(sess_data["sessions"]) == 2, "Expected list length of 2"
            print("[PASS] Paginated sessions endpoint verified.")
            passes += 1

            # 5. Check session details query
            detail_res = await client.get(f"/api/sessions/{session_1_id}", headers=headers)
            assert detail_res.status_code == 200, f"Detail failed: {detail_res.json()}"
            detail_data = detail_res.json()
            assert detail_data["dominant_emotion"] == "neutral"
            assert len(detail_data["records"]) == 1
            assert detail_data["records"][0]["neutral"] == 80.0
            print("[PASS] Session details endpoint verified.")
            passes += 1

            # 6. Check dashboard analytics calculations
            an_res = await client.get("/api/analytics/dashboard?range=7", headers=headers)
            assert an_res.status_code == 200, f"Analytics failed: {an_res.json()}"
            an_data = an_res.json()
            assert an_data["total_sessions"] == 2
            assert an_data["total_detections"] == 2
            assert an_data["mood_score"] > 0, "Mood score calculation was 0"
            assert len(an_data["mood_timeline"]) >= 1
            print(f"[PASS] Aggregated dashboard calculations verified. Mood score={an_data['mood_score']}.")
            passes += 1

            # 7. Check session deletion
            del_res = await client.delete(f"/api/sessions/{session_1_id}", headers=headers)
            assert del_res.status_code == 200
            
            # Check sessions list again
            sess_res2 = await client.get("/api/sessions", headers=headers)
            assert sess_res2.json()["total"] == 1
            print("[PASS] Session deletion endpoint verified.")
            passes += 1

            # 8. Check batch session creation via POST /api/sessions
            create_payload = {
                "records": [
                    {
                        "timestamp": "2026-05-21T10:00:00Z",
                        "face_index": 0,
                        "box_x": 15,
                        "box_y": 15,
                        "box_w": 110,
                        "box_h": 110,
                        "dominant_emotion": "surprise",
                        "confidence": 90.0,
                        "happy": 0.0, "sad": 5.0, "angry": 0.0, "neutral": 5.0, "fear": 0.0, "surprise": 90.0, "disgust": 0.0
                    }
                ]
            }
            post_res = await client.post("/api/sessions", json=create_payload, headers=headers)
            assert post_res.status_code == 201, f"POST /api/sessions failed: {post_res.json()}"
            post_data = post_res.json()
            assert post_data["dominant_emotion"] == "surprise"
            assert post_data["average_confidence"] == 90.0
            assert len(post_data["records"]) == 1
            assert post_data["records"][0]["box_x"] == 15
            print("[PASS] Session batch creation endpoint verified.")
            passes += 1

            print(f"\nALL PHASE 5 BACKEND TESTS PASSED SUCCESSFULLY! ({passes} checks passed)")

        except AssertionError as err:
            print(f"[FAIL] Assertion error during verification: {err}")
            failures += 1
        except Exception as exc:
            print(f"[FAIL] Unexpected error: {exc}")
            import traceback
            traceback.print_exc()
            failures += 1
        finally:
            app.dependency_overrides.clear()
            await teardown_db()

    if failures > 0:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_verification())

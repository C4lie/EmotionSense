import asyncio
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.session import EmotionSession
from app.models.record import EmotionRecord

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(EmotionSession))
        sessions = res.scalars().all()
        print(f"Total sessions in DB: {len(sessions)}")
        for s in sessions:
            res_rec = await db.execute(select(func.count(EmotionRecord.id)).where(EmotionRecord.session_id == s.id))
            rec_count = res_rec.scalar()
            print(f"Session {s.id}: type={s.session_type}, dominant={s.dominant_emotion}, user_id={s.user_id}, started={s.started_at}, records={rec_count}")

if __name__ == "__main__":
    asyncio.run(main())


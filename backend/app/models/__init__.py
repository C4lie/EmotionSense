"""
app/models/__init__.py

Models package. Importing all models here ensures they are registered
on Base.metadata before `init_db()` creates the database tables.
"""

from app.models.user import User
from app.models.session import EmotionSession
from app.models.record import EmotionRecord
from app.models.subscription import Subscription
from app.models.tone_report import ToneReport
from app.models.challenge import Challenge
from app.models.streak import Streak

__all__ = ["User", "EmotionSession", "EmotionRecord", "Subscription", "ToneReport", "Challenge", "Streak"]

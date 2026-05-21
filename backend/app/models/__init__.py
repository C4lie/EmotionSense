"""
app/models/__init__.py

Models package. Importing all models here ensures they are registered
on Base.metadata before `init_db()` creates the database tables.
"""

from app.models.user import User
from app.models.session import EmotionSession
from app.models.record import EmotionRecord

__all__ = ["User", "EmotionSession", "EmotionRecord"]

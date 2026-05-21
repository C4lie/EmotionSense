"""
app/models/user.py

User database model.

Represents registered platform users. Stores credentials and profile info.
Password is NEVER stored in plain text — only bcrypt hashes.
"""

import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.session import EmotionSession


class User(UUIDMixin, TimestampMixin, Base):
    """
    Users table. One user can have many emotion detection sessions.

    Relationships:
        sessions: All emotion detection sessions belonging to this user.
    """

    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationship: one user → many sessions
    sessions: Mapped[List["EmotionSession"]] = relationship(
        "EmotionSession",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"

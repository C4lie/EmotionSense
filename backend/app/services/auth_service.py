"""
app/services/auth_service.py

Authentication business logic.

Architecture: Controller → Service → Model
This service handles all auth business logic (no HTTP awareness).
Routes call this service; this service talks to the database.

Never put SQL queries or password hashing directly in routes.
"""

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserOut, TokenOut


class AuthService:
    """
    Handles user registration, login, and profile retrieval.

    All methods accept an AsyncSession for database operations.
    """

    async def register_user(
        self, db: AsyncSession, payload: UserCreate
    ) -> TokenOut:
        """
        Create a new user account.

        Steps:
          1. Check if email is already registered.
          2. Hash the password.
          3. Create and persist the User record.
          4. Generate and return a JWT access token.

        Raises:
            ValueError: If email is already taken.
        """
        # 1. Check for duplicate email
        existing = await self._get_user_by_email(db, payload.email)
        if existing:
            raise ValueError("An account with this email address already exists.")

        # 2. Hash password before storing
        password_hash = hash_password(payload.password)

        # 3. Create user record
        user = User(
            name=payload.name,
            email=payload.email.lower(),
            password_hash=password_hash,
        )
        db.add(user)
        await db.flush()  # Flush to get the generated UUID without committing
        await db.refresh(user)

        # 4. Create access token using the user's UUID as subject
        token = create_access_token(subject=str(user.id))

        return TokenOut(
            user=UserOut.model_validate(user),
            access_token=token,
        )

    async def login_user(
        self, db: AsyncSession, payload: UserLogin
    ) -> TokenOut:
        """
        Authenticate a user with email and password.

        Steps:
          1. Look up user by email.
          2. Verify the supplied password against the stored hash.
          3. Return a new JWT access token.

        Raises:
            ValueError: If credentials are invalid (generic message to prevent enumeration).
        """
        user = await self._get_user_by_email(db, payload.email)

        # Use generic error message to prevent email enumeration attacks
        invalid_credentials_error = ValueError("Invalid email or password.")

        if not user:
            raise invalid_credentials_error

        if not verify_password(payload.password, user.password_hash):
            raise invalid_credentials_error

        token = create_access_token(subject=str(user.id))

        return TokenOut(
            user=UserOut.model_validate(user),
            access_token=token,
        )

    async def get_user_by_id(
        self, db: AsyncSession, user_id: str
    ) -> Optional[User]:
        """
        Fetch a user record by their UUID string.

        Returns None if not found.
        """
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            return None

        result = await db.execute(select(User).where(User.id == uid))
        return result.scalar_one_or_none()

    # ─── Private Helpers ──────────────────────────────────────────────────────

    async def _get_user_by_email(
        self, db: AsyncSession, email: str
    ) -> Optional[User]:
        """Fetch a user by their email address (case-insensitive)."""
        result = await db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()


# Singleton service instance — import this in routes
auth_service = AuthService()

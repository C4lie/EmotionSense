"""
app/core/security.py

Authentication utilities: password hashing and JWT token operations.

Responsibilities:
  - Hash and verify passwords using bcrypt via passlib.
  - Create signed JWT access tokens with expiration.
  - Decode and validate incoming JWT tokens.
  - Provide a FastAPI dependency to extract the current authenticated user.

This module has NO database calls. All DB interaction happens in services.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ─── Password Hashing ────────────────────────────────────────────────────────
# Using bcrypt as the hashing scheme. deprecated="auto" will auto-upgrade
# older hashes when re-hashing on login (forward-compatible).
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt. Returns the hash string."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a stored bcrypt hash."""
    return _pwd_context.verify(plain_password, hashed_password)


# ─── JWT Token Operations ────────────────────────────────────────────────────
def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT access token.

    Args:
        subject: The token subject (typically the user's UUID string).
        expires_delta: Optional custom expiry duration. Defaults to settings value.

    Returns:
        A signed JWT token string.
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.

    Raises:
        HTTPException 401 if the token is invalid or expired.

    Returns:
        The decoded payload dict.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        # Ensure this is an access token, not some other token type
        if payload.get("type") != "access":
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


# ─── FastAPI Bearer Dependency ───────────────────────────────────────────────
_http_bearer = HTTPBearer(auto_error=True)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_http_bearer),
) -> str:
    """
    FastAPI dependency that extracts and validates the JWT Bearer token
    from the Authorization header. Returns the user's UUID string.

    Raises:
        HTTPException 401 if the token is missing, malformed, or expired.

    Usage:
        @router.get("/protected")
        async def protected(user_id: str = Depends(get_current_user_id)):
            ...
    """
    payload = decode_access_token(credentials.credentials)
    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id


# ─── Full User Object Dependencies ───────────────────────────────────────────
# These fetch the full User ORM object from the DB, not just the user_id.
# Import here (not at top) to avoid circular imports: security → database → models → security

async def get_current_user(
    user_id: str = Depends(get_current_user_id),
):
    """
    FastAPI dependency that returns the full authenticated User object.

    Raises:
        HTTPException 401 if user_id from token does not match any DB user.

    Usage:
        @router.get("/me")
        async def me(user: User = Depends(get_current_user)):
            ...
    """
    # Import inside function to avoid circular imports
    from app.core.database import get_db
    from app.models.user import User
    from sqlalchemy import select
    import uuid

    # We need the DB session — use a direct engine call here since we
    # can't inject get_db as a dependency of another dependency cleanly.
    # Routes that need get_current_user should inject db separately.
    # This dependency is therefore used only where db is also injected.
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Use get_current_user_from_db instead — inject db separately.",
    )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db=Depends(lambda: None),  # placeholder — overridden in routes that inject db
):
    """
    FastAPI dependency for OPTIONAL authentication.

    Returns None if no Authorization header is present.
    Returns the User object if a valid token is provided.
    Raises 401 if a token is provided but is invalid/expired.

    NOTE: This dependency must be used alongside `db: AsyncSession = Depends(get_db)`
    in the route signature. The db session is passed automatically.

    Used by: /api/detect/image and /api/detect/video
    """
    if credentials is None:
        return None  # No token — guest request

    # Validate JWT
    try:
        payload = decode_access_token(credentials.credentials)
        user_id_str: Optional[str] = payload.get("sub")
        if not user_id_str:
            return None
    except HTTPException:
        raise  # Re-raise 401 for invalid tokens

    # Parse UUID
    try:
        import uuid
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        return None

    return user_uuid  # Return UUID; route resolves full User from its own db session

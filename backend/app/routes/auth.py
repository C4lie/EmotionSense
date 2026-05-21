"""
app/routes/auth.py

Authentication API endpoints.

Architecture: Route → Service → Model
Routes only handle HTTP concerns (request parsing, response formatting, status codes).
All business logic lives in auth_service.

Endpoints:
  POST /api/auth/register  — Create new account
  POST /api/auth/login     — Authenticate and receive JWT
  GET  /api/auth/me        — Get current user profile (protected)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas.auth import TokenOut, UserCreate, UserLogin, UserOut
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description="Creates a new user account and returns a JWT access token.",
)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> TokenOut:
    """
    Register a new user.

    - Validates email uniqueness
    - Hashes password with bcrypt
    - Returns JWT access token immediately (no email verification in MVP)
    """
    try:
        return await auth_service.register_user(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )


@router.post(
    "/login",
    response_model=TokenOut,
    status_code=status.HTTP_200_OK,
    summary="Login with email and password",
    description="Authenticates the user and returns a JWT access token.",
)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenOut:
    """
    Login with email and password.

    - Verifies password against bcrypt hash
    - Returns fresh JWT access token on success
    - Returns generic 401 on any credential mismatch (prevents enumeration)
    """
    try:
        return await auth_service.login_user(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get(
    "/me",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
    description="Returns the profile of the currently authenticated user.",
)
async def get_me(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    """
    Fetch the current user's profile using the JWT subject (user ID).

    - Requires valid Bearer token in Authorization header
    - Returns 401 if token is missing or expired
    - Returns 404 if user no longer exists in DB (edge case: deleted account)
    """
    user = await auth_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
    return UserOut.model_validate(user)

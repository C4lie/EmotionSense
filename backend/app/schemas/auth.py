"""
app/schemas/auth.py

Pydantic schemas for authentication API endpoints.

Separates the API contract (schemas) from the database model (SQLAlchemy).
All schemas use strict validation and sanitization.
"""

import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    """Schema for POST /api/auth/register request body."""

    name: str = Field(..., min_length=2, max_length=255, description="Full display name")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (min 8 characters)",
    )

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name must not be blank.")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        """Enforce basic password strength — not all numeric."""
        if v.isdigit():
            raise ValueError("Password must not be all numeric characters.")
        return v


class UserLogin(BaseModel):
    """Schema for POST /api/auth/login request body."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")


class UserOut(BaseModel):
    """Schema returned in responses after successful auth or profile fetch."""

    id: uuid.UUID
    name: str
    email: EmailStr

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    """Schema for login/register responses that include a JWT access token."""

    user: UserOut
    access_token: str
    token_type: str = "bearer"

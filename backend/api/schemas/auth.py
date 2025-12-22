"""
Pydantic schemas for authentication.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""

    username: Optional[str] = None
    user_id: Optional[int] = None


class LoginRequest(BaseModel):
    """Login request schema."""

    username: str
    password: str


class UserCreate(BaseModel):
    """Schema for creating a user."""

    username: str
    email: EmailStr
    password: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""


class UserResponse(BaseModel):
    """Schema for user response."""

    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    is_active: bool
    is_staff: bool
    role: str  # 'admin' or 'readonly'

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for password reset request."""

    token: str
    new_password: str
    confirm_password: str


class PasswordResetResponse(BaseModel):
    """Schema for password reset responses."""

    message: str
    success: bool = True

"""
Authentication routes for FastAPI.
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from asgiref.sync import sync_to_async

from api.schemas import (
    Token, TokenData, UserResponse, LoginRequest,
    ForgotPasswordRequest, ResetPasswordRequest, PasswordResetResponse
)
from core.models import PasswordResetToken

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


@sync_to_async
def authenticate_user(username: str, password: str):
    """Authenticate user synchronously wrapped for async."""
    return authenticate(username=username, password=password)


@sync_to_async
def get_user_by_username(username: str):
    """Get user by username synchronously wrapped for async."""
    try:
        return User.objects.get(username=username)
    except User.DoesNotExist:
        return None


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get the current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, user_id=user_id)
    except JWTError:
        raise credentials_exception

    user = await get_user_by_username(token_data.username)
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the current user is active."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 compatible token login endpoint."""
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id}
    )
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
async def login(request: LoginRequest):
    """JSON login endpoint."""
    user = await authenticate_user(request.username, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id}
    )
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        is_active=current_user.is_active,
        is_staff=current_user.is_staff,
    )


@sync_to_async
def get_user_by_email(email: str):
    """Get user by email synchronously wrapped for async."""
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None


@sync_to_async
def create_password_reset_token(user):
    """Create a password reset token for the user."""
    return PasswordResetToken.create_for_user(
        user,
        hours_valid=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS
    )


@sync_to_async
def get_valid_reset_token(token: str):
    """Get a valid password reset token."""
    try:
        reset_token = PasswordResetToken.objects.select_related('user').get(token=token)
        if reset_token.is_valid:
            return reset_token
        return None
    except PasswordResetToken.DoesNotExist:
        return None


@sync_to_async
def mark_token_as_used(reset_token):
    """Mark the token as used."""
    reset_token.used_at = timezone.now()
    reset_token.save()


@sync_to_async
def update_user_password(user, new_password: str):
    """Update user password."""
    user.set_password(new_password)
    user.save()


@sync_to_async
def send_reset_email(user, reset_url: str):
    """Send password reset email."""
    subject = "Réinitialisation de votre mot de passe - Annex9 Generator"
    message = f"""Bonjour {user.first_name or user.username},

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur le lien suivant pour définir un nouveau mot de passe:
{reset_url}

Ce lien est valide pendant {settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS} heures.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe Annex9 Generator
"""
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


@router.post("/forgot-password", response_model=PasswordResetResponse)
async def forgot_password(request: ForgotPasswordRequest):
    """Request a password reset email."""
    user = await get_user_by_email(request.email)

    # Always return success to prevent email enumeration
    if not user:
        return PasswordResetResponse(
            message="Si un compte existe avec cet email, vous recevrez un lien de réinitialisation."
        )

    # Create reset token
    reset_token = await create_password_reset_token(user)

    # Build reset URL
    reset_url = f"{settings.PASSWORD_RESET_URL}/{reset_token.token}"

    # Send email
    try:
        await send_reset_email(user, reset_url)
    except Exception as e:
        # Log the error but don't expose it to the user
        print(f"Failed to send reset email: {e}")

    return PasswordResetResponse(
        message="Si un compte existe avec cet email, vous recevrez un lien de réinitialisation."
    )


@router.post("/reset-password", response_model=PasswordResetResponse)
async def reset_password(request: ResetPasswordRequest):
    """Reset password using a valid token."""
    # Validate passwords match
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les mots de passe ne correspondent pas."
        )

    # Validate password strength (minimum 8 characters)
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins 8 caractères."
        )

    # Get and validate token
    reset_token = await get_valid_reset_token(request.token)

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le lien de réinitialisation est invalide ou a expiré."
        )

    # Update password
    await update_user_password(reset_token.user, request.new_password)

    # Mark token as used
    await mark_token_as_used(reset_token)

    return PasswordResetResponse(
        message="Votre mot de passe a été réinitialisé avec succès."
    )

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.common import CurrentPassword, DisplayName, Password


class RegisterRequest(BaseModel):
    email: EmailStr
    password: Password
    display_name: DisplayName


class LoginRequest(BaseModel):
    email: EmailStr
    password: CurrentPassword


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    display_name: str
    role: str
    has_avatar: bool = False
    avatar_updated_at: datetime | None = None


class TokenResponse(BaseModel):
    """`access_token` is null for browser calls, which rely on the httpOnly session cookie only."""

    access_token: str | None
    token_type: str = "bearer"
    user: UserOut

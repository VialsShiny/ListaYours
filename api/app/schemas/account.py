from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator

from app.schemas.auth import MAX_PASSWORD_BYTES, check_password_bytes

DisplayName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


class ProfileUpdate(BaseModel):
    """Editable profile fields only: the role and the identifiers are never accepted here."""

    model_config = ConfigDict(extra="forbid")

    display_name: DisplayName | None = None
    email: EmailStr | None = None


class PasswordChange(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(min_length=1, max_length=MAX_PASSWORD_BYTES)
    new_password: str = Field(min_length=8, max_length=MAX_PASSWORD_BYTES)

    @field_validator("current_password", "new_password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        return check_password_bytes(value)

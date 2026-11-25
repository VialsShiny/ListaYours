from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.common import CurrentPassword, DisplayName, Password


class ProfileUpdate(BaseModel):
    """Editable profile fields only: the role and the identifiers are never accepted here.

    Changing the e-mail also requires `current_password`.
    """

    model_config = ConfigDict(extra="forbid")

    display_name: DisplayName | None = None
    email: EmailStr | None = None
    current_password: CurrentPassword | None = None


class PasswordChange(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: CurrentPassword
    new_password: Password

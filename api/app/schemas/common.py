"""Field types shared by every request schema."""

from typing import Annotated

from pydantic import AfterValidator, Field, HttpUrl, StringConstraints

MAX_PASSWORD_BYTES = 72
MIN_PASSWORD_LENGTH = 8
MAX_URL_LENGTH = 2048


def check_password_bytes(value: str) -> str:
    """bcrypt only hashes the first 72 bytes, so refuse longer passwords instead of silently truncating."""
    if len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError(f"Le mot de passe ne doit pas dépasser {MAX_PASSWORD_BYTES} octets.")
    return value


def check_url_length(value: HttpUrl) -> HttpUrl:
    if len(str(value)) > MAX_URL_LENGTH:
        raise ValueError(f"L'URL ne doit pas dépasser {MAX_URL_LENGTH} caractères.")
    return value


Password = Annotated[
    str,
    Field(min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_BYTES),
    AfterValidator(check_password_bytes),
]
CurrentPassword = Annotated[
    str,
    Field(min_length=1, max_length=MAX_PASSWORD_BYTES),
    AfterValidator(check_password_bytes),
]
DisplayName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
BoundedUrl = Annotated[HttpUrl, AfterValidator(check_url_length)]

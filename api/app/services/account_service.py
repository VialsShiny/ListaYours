from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.models import User
from app.schemas.account import PasswordChange, ProfileUpdate
from app.services.auth_service import hash_password, verify_password
from app.services.errors import Conflict, ServiceError
from app.utils.images import ImageError, prepare_avatar

EMAIL_TAKEN = "Un compte existe déjà avec cet e-mail."
EMAIL_RESERVED = "Cet e-mail est réservé."
WRONG_PASSWORD = "Mot de passe actuel incorrect."
NO_AVATAR = "Pas de photo pour ce compte."


class AccountError(ServiceError):
    pass


def _check_email_free(db: Session, user: User, email: str) -> None:
    if email == get_settings().owner_email and not user.is_owner:
        raise Conflict(EMAIL_RESERVED)
    other = db.scalar(select(User).where(User.email == email, User.id != user.id))
    if other is not None:
        raise Conflict(EMAIL_TAKEN)


def update_profile(db: Session, user: User, payload: ProfileUpdate) -> User:
    """Change the display name and / or the e-mail of the caller; the role is never touched."""
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("display_name") is not None:
        user.display_name = changes["display_name"]
    if changes.get("email") is not None:
        email = changes["email"].strip().lower()
        if email != user.email:
            _check_email_free(db, user, email)
            user.email = email
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise Conflict(EMAIL_TAKEN) from error
    db.refresh(user)
    return user


def change_password(db: Session, user: User, payload: PasswordChange) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise AccountError(WRONG_PASSWORD, 400)
    user.password_hash = hash_password(payload.new_password)
    db.commit()


def set_avatar(db: Session, user: User, data: bytes) -> User:
    """Replace the caller's picture with a re-encoded 256 px square; the client file is never stored as is."""
    try:
        user.avatar = prepare_avatar(data)
    except ImageError as error:
        raise AccountError(error.message, 422) from error
    user.avatar_updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(user)
    return user


def clear_avatar(db: Session, user: User) -> User:
    user.avatar = None
    user.avatar_updated_at = None
    db.commit()
    db.refresh(user)
    return user


def require_avatar(user: User) -> bytes:
    if user.avatar is None:
        raise AccountError(NO_AVATAR, 404)
    return user.avatar

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.models import User
from app.schemas.account import PasswordChange, ProfileUpdate
from app.services.auth_service import EMAIL_TAKEN, hash_password, revoke_sessions, verify_password
from app.services.db import commit_or_conflict
from app.services.errors import Conflict, ServiceError
from app.utils.images import ImageError, prepare_avatar

EMAIL_RESERVED = "Cet e-mail est réservé."
OWNER_EMAIL_FIXED = "L'e-mail du propriétaire est fixé par la configuration."
WRONG_PASSWORD = "Mot de passe actuel incorrect."
PASSWORD_REQUIRED = "Le mot de passe actuel est requis pour changer d'e-mail."
NO_AVATAR = "Pas de photo pour ce compte."


class AccountError(ServiceError):
    pass


def _check_email_change(db: Session, user: User, email: str, current_password: str | None) -> None:
    """A new e-mail needs the current password, must not be the owner's, and must be free."""
    if not current_password:
        raise AccountError(PASSWORD_REQUIRED, 400)
    if not verify_password(current_password, user.password_hash):
        raise AccountError(WRONG_PASSWORD, 400)
    owner_email = get_settings().owner_email
    if user.is_owner and email != owner_email:
        raise Conflict(OWNER_EMAIL_FIXED)
    if email == owner_email and not user.is_owner:
        raise Conflict(EMAIL_RESERVED)
    other = db.scalar(select(User).where(User.email == email, User.id != user.id))
    if other is not None:
        raise Conflict(EMAIL_TAKEN)


def update_profile(db: Session, user: User, payload: ProfileUpdate) -> User:
    """Change the display name and / or the e-mail of the caller; the role is never touched."""
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("email") is not None:
        email = changes["email"].strip().lower()
        if email != user.email:
            _check_email_change(db, user, email, changes.get("current_password"))
            user.email = email
    if changes.get("display_name") is not None:
        user.display_name = changes["display_name"]
    commit_or_conflict(db, EMAIL_TAKEN)
    db.refresh(user)
    return user


def change_password(db: Session, user: User, payload: PasswordChange) -> User:
    """Set a new password and revoke every existing session; the caller re-issues one for the current browser."""
    if not verify_password(payload.current_password, user.password_hash):
        raise AccountError(WRONG_PASSWORD, 400)
    user.password_hash = hash_password(payload.new_password)
    revoke_sessions(user)
    db.commit()
    db.refresh(user)
    return user


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

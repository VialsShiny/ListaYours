import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.models import ROLE_OWNER, ROLE_VISITOR, User
from app.schemas.auth import RegisterRequest
from app.services.wishlist_service import create_default_wishlist


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


DUMMY_HASH = bcrypt.hashpw(b"timing-equalizer", bcrypt.gensalt()).decode("utf-8")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user: User) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_expires_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> uuid.UUID | None:
    try:
        payload = jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
        return uuid.UUID(str(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def role_for_email(email: str) -> str:
    return ROLE_OWNER if email == get_settings().owner_email else ROLE_VISITOR


def register_user(db: Session, payload: RegisterRequest) -> User:
    """Create a user; the configured owner e-mail becomes the owner and receives an empty wishlist."""
    email = payload.email.strip().lower()
    if db.scalar(select(User).where(User.email == email)) is not None:
        raise AuthError("Un compte existe déjà avec cet e-mail.", 409)
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name.strip(),
        role=role_for_email(email),
    )
    db.add(user)
    try:
        db.flush()
        if user.role == ROLE_OWNER:
            create_default_wishlist(db, user)
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise AuthError("Un compte existe déjà avec cet e-mail.", 409) from error
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User:
    """Check credentials; an unknown e-mail still costs one bcrypt comparison so timing does not reveal accounts."""
    user = db.scalar(select(User).where(User.email == email.strip().lower()))
    password_ok = verify_password(password, user.password_hash if user else DUMMY_HASH)
    if user is None or not password_ok:
        raise AuthError("E-mail ou mot de passe incorrect.", 401)
    return user


def get_user(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)

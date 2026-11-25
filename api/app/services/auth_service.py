import uuid
from datetime import UTC, datetime, timedelta
from typing import NamedTuple

import bcrypt
import jwt
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.models import ROLE_OWNER, ROLE_VISITOR, User
from app.schemas.auth import RegisterRequest
from app.services.errors import ServiceError
from app.services.wishlist_service import create_default_wishlist

TOKEN_ISSUER = "listayours-api"
TOKEN_ALGORITHM = "HS256"
REQUIRED_CLAIMS = ["exp", "iat", "sub", "iss", "ver"]
EMAIL_TAKEN = "Un compte existe déjà avec cet e-mail."
BAD_CREDENTIALS = "E-mail ou mot de passe incorrect."


class AuthError(ServiceError):
    pass


class TokenClaims(NamedTuple):
    user_id: uuid.UUID
    version: int


DUMMY_HASH = bcrypt.hashpw(b"timing-equalizer", bcrypt.gensalt()).decode("utf-8")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user: User) -> str:
    """Sign a session token; `ver` ties it to the user's token_version so bumping it revokes every session."""
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": str(user.id),
        "ver": user.token_version or 0,
        "iss": TOKEN_ISSUER,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_expires_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=TOKEN_ALGORITHM)


def decode_access_token(token: str) -> TokenClaims | None:
    """Verify signature, issuer and expiry; a token missing any required claim is refused."""
    try:
        payload = jwt.decode(
            token,
            get_settings().jwt_secret,
            algorithms=[TOKEN_ALGORITHM],
            issuer=TOKEN_ISSUER,
            options={"require": REQUIRED_CLAIMS},
        )
        version = payload["ver"]
        if not isinstance(version, int) or isinstance(version, bool):
            return None
        return TokenClaims(uuid.UUID(str(payload["sub"])), version)
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def revoke_sessions(user: User) -> None:
    """Invalidate every token issued so far for `user`; the caller commits."""
    user.token_version = (user.token_version or 0) + 1


def _owner_exists(db: Session) -> bool:
    return db.scalar(select(User.id).where(User.role == ROLE_OWNER).limit(1)) is not None


def role_for_email(db: Session, email: str) -> str:
    """The configured owner e-mail becomes the owner, but only while no owner account exists yet."""
    if email == get_settings().owner_email and not _owner_exists(db):
        return ROLE_OWNER
    return ROLE_VISITOR


def register_user(db: Session, payload: RegisterRequest) -> User:
    """Create a user; the first account with the configured owner e-mail becomes the owner with an empty wishlist."""
    email = payload.email.strip().lower()
    if db.scalar(select(User).where(User.email == email)) is not None:
        raise AuthError(EMAIL_TAKEN, 409)
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
        role=role_for_email(db, email),
    )
    db.add(user)
    try:
        db.flush()
        if user.role == ROLE_OWNER:
            create_default_wishlist(db, user)
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise AuthError(EMAIL_TAKEN, 409) from error
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User:
    """Check credentials; an unknown e-mail still costs one bcrypt comparison so timing does not reveal accounts."""
    user = db.scalar(select(User).where(User.email == email.strip().lower()))
    password_ok = verify_password(password, user.password_hash if user else DUMMY_HASH)
    if user is None or not password_ok:
        raise AuthError(BAD_CREDENTIALS, 401)
    return user


def get_user(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)

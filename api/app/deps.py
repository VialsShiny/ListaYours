from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.models import User
from app.db.session import get_db
from app.services.auth_service import decode_access_token, get_user
from app.utils.rate_limit import SlidingWindowLimiter, enforce

bearer = HTTPBearer(auto_error=False)
auth_limiter = SlidingWindowLimiter(limit=get_settings().rate_limit_per_minute)
scrape_limiter = SlidingWindowLimiter(limit=get_settings().rate_limit_per_minute)

DbSession = Annotated[Session, Depends(get_db)]


def get_optional_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> User | None:
    if credentials is None:
        return None
    user_id = decode_access_token(credentials.credentials)
    return get_user(db, user_id) if user_id else None


def get_current_user(user: Annotated[User | None, Depends(get_optional_user)]) -> User:
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Connexion requise.")
    return user


def require_owner(user: Annotated[User, Depends(get_current_user)]) -> User:
    if not user.is_owner:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Réservé au propriétaire de la liste.")
    return user


def require_visitor(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.is_owner:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Le propriétaire ne peut pas réserver de cadeau.")
    return user


def auth_rate_limit(request: Request) -> None:
    enforce(auth_limiter, request, "auth", get_settings().trust_proxy_headers)


def scrape_rate_limit(request: Request, owner: Annotated[User, Depends(require_owner)]) -> None:
    """Budget the scraper per authenticated owner, so unauthenticated callers cannot burn it."""
    if not scrape_limiter.allow(f"scrape:{owner.id}"):
        enforce(scrape_limiter, request, "scrape-blocked", get_settings().trust_proxy_headers)
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Trop de requêtes, réessayez dans une minute.")


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
OwnerUser = Annotated[User, Depends(require_owner)]
VisitorUser = Annotated[User, Depends(require_visitor)]

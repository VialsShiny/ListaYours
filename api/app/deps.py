from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.models import User
from app.db.session import get_db
from app.limits import reservation_limiter, scrape_limiter
from app.services.auth_service import decode_access_token, get_user
from app.utils.rate_limit import too_many_requests
from app.utils.session import read_session_cookie

bearer = HTTPBearer(auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]


def get_optional_user(
    request: Request,
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> User | None:
    """A Bearer token for non-browser clients, else the session cookie set by the API itself.

    Any Authorization header, whatever its scheme, disables the cookie fallback. A token whose version
    no longer matches the account (password changed, logged out) is refused.
    """
    if request.headers.get("authorization") is not None:
        token = credentials.credentials if credentials is not None else None
    else:
        token = read_session_cookie(request, get_settings())
    if not token:
        return None
    claims = decode_access_token(token)
    if claims is None:
        return None
    user = get_user(db, claims.user_id)
    if user is None or user.token_version != claims.version:
        return None
    return user


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


def scrape_rate_limit(owner: Annotated[User, Depends(require_owner)]) -> None:
    """Budget the scraper per authenticated owner, so unauthenticated callers cannot burn it."""
    if not scrape_limiter.allow(f"scrape:{owner.id}"):
        raise too_many_requests()


def reservation_rate_limit(visitor: Annotated[User, Depends(require_visitor)]) -> None:
    if not reservation_limiter.allow(f"reservation:{visitor.id}"):
        raise too_many_requests()


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
OwnerUser = Annotated[User, Depends(require_owner)]
VisitorUser = Annotated[User, Depends(require_visitor)]

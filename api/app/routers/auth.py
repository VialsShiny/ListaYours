from fastapi import APIRouter, Depends, Request, Response, status

from app.config import get_settings
from app.db.models import User
from app.deps import CurrentUser, DbSession, OptionalUser
from app.limits import check_login_email, login_rate_limit, register_rate_limit
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services.auth_service import authenticate, create_access_token, register_user, revoke_sessions
from app.utils.session import clear_session_cookie, is_browser_request, set_session_cookie

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _session_response(request: Request, response: Response, user: User) -> TokenResponse:
    """The token travels in an httpOnly cookie; only non-browser clients also receive it in the body."""
    token = create_access_token(user)
    set_session_cookie(response, token, get_settings())
    body_token = None if is_browser_request(request) else token
    return TokenResponse(access_token=body_token, user=UserOut.model_validate(user))


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(register_rate_limit)],
)
def register(payload: RegisterRequest, request: Request, response: Response, db: DbSession) -> TokenResponse:
    return _session_response(request, response, register_user(db, payload))


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(login_rate_limit)])
def login(payload: LoginRequest, request: Request, response: Response, db: DbSession) -> TokenResponse:
    check_login_email(payload.email)
    return _session_response(request, response, authenticate(db, payload.email, payload.password))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(user: OptionalUser, db: DbSession) -> Response:
    """Sign out everywhere: the cookie is cleared and every token issued for the account stops working."""
    if user is not None:
        revoke_sessions(user)
        db.commit()
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_session_cookie(response, get_settings())
    return response


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)

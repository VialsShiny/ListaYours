from fastapi import APIRouter, Depends, Response, status

from app.config import get_settings
from app.deps import CurrentUser, DbSession, auth_rate_limit
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services.auth_service import authenticate, create_access_token, register_user
from app.utils.session import clear_session_cookie, set_session_cookie

router = APIRouter(prefix="/api/auth", tags=["auth"], dependencies=[Depends(auth_rate_limit)])


def _session_response(response: Response, user) -> TokenResponse:
    """The token travels in an httpOnly cookie for browsers and in the body for other clients."""
    token = create_access_token(user)
    set_session_cookie(response, token, get_settings())
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response, db: DbSession) -> TokenResponse:
    return _session_response(response, register_user(db, payload))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: DbSession) -> TokenResponse:
    return _session_response(response, authenticate(db, payload.email, payload.password))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> Response:
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_session_cookie(response, get_settings())
    return response


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)

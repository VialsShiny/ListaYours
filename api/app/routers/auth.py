from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import CurrentUser, DbSession, auth_rate_limit
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services.auth_service import AuthError, authenticate, create_access_token, register_user

router = APIRouter(prefix="/api/auth", tags=["auth"], dependencies=[Depends(auth_rate_limit)])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: DbSession) -> TokenResponse:
    try:
        user = register_user(db, payload)
    except AuthError as error:
        raise HTTPException(error.status_code, error.message) from error
    return TokenResponse(access_token=create_access_token(user), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    try:
        user = authenticate(db, payload.email, payload.password)
    except AuthError as error:
        raise HTTPException(error.status_code, error.message) from error
    return TokenResponse(access_token=create_access_token(user), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)

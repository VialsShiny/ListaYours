from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.deps import CurrentUser, DbSession, auth_rate_limit
from app.schemas.account import PasswordChange, ProfileUpdate
from app.schemas.auth import UserOut
from app.services.account_service import (
    change_password,
    clear_avatar,
    require_avatar,
    set_avatar,
    update_profile,
)
from app.utils.images import AVATAR_MEDIA_TYPE, MAX_AVATAR_BYTES, TOO_HEAVY

router = APIRouter(prefix="/api/account", tags=["account"])
protected = [Depends(auth_rate_limit)]
AVATAR_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
    "Content-Disposition": 'inline; filename="avatar.webp"',
}


async def read_bounded_body(request: Request, limit: int) -> bytes:
    """Read the raw upload while refusing anything above `limit`, before and during the transfer."""
    declared = request.headers.get("content-length", "")
    if declared.isdigit() and int(declared) > limit:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, TOO_HEAVY)
    chunks: list[bytes] = []
    size = 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > limit:
            raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, TOO_HEAVY)
        chunks.append(chunk)
    return b"".join(chunks)


@router.get("", response_model=UserOut)
def read_account(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)


@router.patch("", response_model=UserOut)
def update_account(payload: ProfileUpdate, user: CurrentUser, db: DbSession) -> UserOut:
    return UserOut.model_validate(update_profile(db, user, payload))


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT, dependencies=protected)
def update_password(payload: PasswordChange, user: CurrentUser, db: DbSession) -> Response:
    change_password(db, user, payload)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/avatar", response_class=Response)
def read_avatar(user: CurrentUser) -> Response:
    return Response(content=require_avatar(user), media_type=AVATAR_MEDIA_TYPE, headers=AVATAR_HEADERS)


@router.put("/avatar", response_model=UserOut, dependencies=protected)
async def upload_avatar(request: Request, user: CurrentUser, db: DbSession) -> UserOut:
    data = await read_bounded_body(request, MAX_AVATAR_BYTES)
    return UserOut.model_validate(set_avatar(db, user, data))


@router.delete("/avatar", response_model=UserOut, dependencies=protected)
def delete_avatar(user: CurrentUser, db: DbSession) -> UserOut:
    return UserOut.model_validate(clear_avatar(db, user))

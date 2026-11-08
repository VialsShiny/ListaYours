import uuid

from fastapi import APIRouter, Response, status

from app.deps import DbSession, OwnerUser
from app.schemas.category import ReorderRequest
from app.schemas.gift import GiftCreate, GiftUpdate, OwnerGiftOut
from app.services import gift_service
from app.services.wishlist_service import require_owner_wishlist

router = APIRouter(prefix="/api/owner/gifts", tags=["owner"])


@router.get("", response_model=list[OwnerGiftOut])
def list_owner_gifts(owner: OwnerUser, db: DbSession) -> list[OwnerGiftOut]:
    wishlist = require_owner_wishlist(db, owner)
    return [OwnerGiftOut.model_validate(gift) for gift in gift_service.list_gifts(db, wishlist)]


@router.post("", response_model=OwnerGiftOut, status_code=status.HTTP_201_CREATED)
def create_owner_gift(payload: GiftCreate, owner: OwnerUser, db: DbSession) -> OwnerGiftOut:
    wishlist = require_owner_wishlist(db, owner)
    return OwnerGiftOut.model_validate(gift_service.create_gift(db, wishlist, payload))


@router.put("/reorder", response_model=list[OwnerGiftOut])
def reorder_owner_gifts(payload: ReorderRequest, owner: OwnerUser, db: DbSession) -> list[OwnerGiftOut]:
    wishlist = require_owner_wishlist(db, owner)
    return [OwnerGiftOut.model_validate(g) for g in gift_service.reorder_gifts(db, wishlist, payload.ids)]


@router.get("/{gift_id}", response_model=OwnerGiftOut)
def read_owner_gift(gift_id: uuid.UUID, owner: OwnerUser, db: DbSession) -> OwnerGiftOut:
    wishlist = require_owner_wishlist(db, owner)
    return OwnerGiftOut.model_validate(gift_service.get_gift(db, wishlist, gift_id))


@router.patch("/{gift_id}", response_model=OwnerGiftOut)
def update_owner_gift(gift_id: uuid.UUID, payload: GiftUpdate, owner: OwnerUser, db: DbSession) -> OwnerGiftOut:
    wishlist = require_owner_wishlist(db, owner)
    return OwnerGiftOut.model_validate(gift_service.update_gift(db, wishlist, gift_id, payload))


@router.delete("/{gift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_owner_gift(gift_id: uuid.UUID, owner: OwnerUser, db: DbSession) -> Response:
    wishlist = require_owner_wishlist(db, owner)
    gift_service.delete_gift(db, wishlist, gift_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

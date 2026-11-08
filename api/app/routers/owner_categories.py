import uuid

from fastapi import APIRouter, Response, status

from app.deps import DbSession, OwnerUser
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate, ReorderRequest
from app.services import category_service
from app.services.wishlist_service import require_owner_wishlist

router = APIRouter(prefix="/api/owner/categories", tags=["owner"])


@router.get("", response_model=list[CategoryOut])
def list_owner_categories(owner: OwnerUser, db: DbSession) -> list[CategoryOut]:
    wishlist = require_owner_wishlist(db, owner)
    return [CategoryOut.model_validate(c) for c in category_service.list_categories(db, wishlist)]


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_owner_category(payload: CategoryCreate, owner: OwnerUser, db: DbSession) -> CategoryOut:
    wishlist = require_owner_wishlist(db, owner)
    return CategoryOut.model_validate(category_service.create_category(db, wishlist, payload.name))


@router.put("/reorder", response_model=list[CategoryOut])
def reorder_owner_categories(payload: ReorderRequest, owner: OwnerUser, db: DbSession) -> list[CategoryOut]:
    wishlist = require_owner_wishlist(db, owner)
    return [CategoryOut.model_validate(c) for c in category_service.reorder_categories(db, wishlist, payload.ids)]


@router.patch("/{category_id}", response_model=CategoryOut)
def rename_owner_category(
    category_id: uuid.UUID, payload: CategoryUpdate, owner: OwnerUser, db: DbSession
) -> CategoryOut:
    wishlist = require_owner_wishlist(db, owner)
    return CategoryOut.model_validate(category_service.rename_category(db, wishlist, category_id, payload.name))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_owner_category(category_id: uuid.UUID, owner: OwnerUser, db: DbSession) -> Response:
    wishlist = require_owner_wishlist(db, owner)
    category_service.delete_category(db, wishlist, category_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Category, Wishlist
from app.services.errors import Conflict, NotFound


def list_categories(db: Session, wishlist: Wishlist) -> list[Category]:
    return list(db.scalars(select(Category).where(Category.wishlist_id == wishlist.id).order_by(Category.position)))


def get_category(db: Session, wishlist: Wishlist, category_id: uuid.UUID) -> Category:
    category = db.get(Category, category_id)
    if category is None or category.wishlist_id != wishlist.id:
        raise NotFound("Catégorie introuvable.")
    return category


def create_category(db: Session, wishlist: Wishlist, name: str) -> Category:
    name = name.strip()
    duplicate = db.scalar(select(Category).where(Category.wishlist_id == wishlist.id, Category.name == name))
    if duplicate is not None:
        raise Conflict("Cette catégorie existe déjà.")
    next_position = db.scalar(select(func.count()).select_from(Category).where(Category.wishlist_id == wishlist.id))
    category = Category(wishlist_id=wishlist.id, name=name, position=next_position or 0)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def rename_category(db: Session, wishlist: Wishlist, category_id: uuid.UUID, name: str) -> Category:
    category = get_category(db, wishlist, category_id)
    name = name.strip()
    duplicate = db.scalar(
        select(Category).where(Category.wishlist_id == wishlist.id, Category.name == name, Category.id != category.id)
    )
    if duplicate is not None:
        raise Conflict("Cette catégorie existe déjà.")
    category.name = name
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, wishlist: Wishlist, category_id: uuid.UUID) -> None:
    category = get_category(db, wishlist, category_id)
    for gift in category.gifts:
        gift.category_id = None
    db.delete(category)
    db.commit()


def reorder_categories(db: Session, wishlist: Wishlist, ordered_ids: list[uuid.UUID]) -> list[Category]:
    categories = {category.id: category for category in list_categories(db, wishlist)}
    if set(ordered_ids) != set(categories) or len(ordered_ids) != len(categories):
        raise NotFound("La liste d'identifiants ne correspond pas aux catégories.")
    for position, category_id in enumerate(ordered_ids):
        categories[category_id].position = position
    db.commit()
    return list_categories(db, wishlist)

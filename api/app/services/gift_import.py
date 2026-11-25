"""CSV gift import: validate every row with the regular gift schema, then write everything or nothing."""

from dataclasses import dataclass
from typing import Any

from pydantic import ValidationError
from pydantic_core import ErrorDetails
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import Category, Gift, Wishlist
from app.schemas.gift import GiftCreate
from app.schemas.gift_import import MAX_IMPORT_CHARS, GiftImportResult, GiftImportRowError
from app.services import category_service, gift_service
from app.services.csv_rows import CsvRow, parse_price, parse_visibility, read_rows
from app.services.errors import Conflict, ServiceError

MAX_CATEGORY_LENGTH = 80
TOO_LARGE = "Le fichier est trop volumineux (maximum 1 000 000 caractères)."
IMPORT_CONFLICT = "L'import a été interrompu par une modification simultanée. Réessayez."
FIELD_LABELS = {
    "name": "Le nom",
    "description": "La description",
    "price": "Le prix",
    "old_price": "L'ancien prix",
    "currency": "La devise",
    "purchase_url": "Le lien",
    "image_url": "L'image",
    "category": "La catégorie",
    "is_visible": "La visibilité",
}
URL_ERRORS = {"url_parsing", "url_scheme", "url_type", "url_syntax_violation", "url_too_long"}


@dataclass(frozen=True)
class CheckedRow:
    gift: GiftCreate | None
    category: str | None
    error: GiftImportRowError | None


def translate_error(detail: ErrorDetails) -> tuple[str | None, str]:
    """The first Pydantic error of a row as (field, French message)."""
    field = str(detail["loc"][0]) if detail["loc"] else None
    label = FIELD_LABELS.get(field or "", "La valeur")
    kind = detail["type"]
    ctx = detail.get("ctx") or {}
    if kind in {"missing", "string_too_short"} and field == "name":
        return field, "Le nom est obligatoire."
    if kind == "string_too_long":
        return field, f"{label} est trop long (maximum {ctx.get('max_length')} caractères)."
    if kind in URL_ERRORS:
        return field, f"{label} doit être une adresse web valide commençant par http:// ou https://."
    if kind == "greater_than_equal":
        return field, f"{label} ne peut pas être négatif."
    if kind == "less_than":
        return field, f"{label} est trop élevé."
    if kind == "value_error" and "error" in ctx:
        return field, str(ctx["error"])
    return field, f"{label} est invalide."


def _row_payload(values: dict[str, str]) -> dict[str, Any]:
    payload: dict[str, Any] = {"name": values.get("name", ""), "description": values.get("description", "")}
    for field in ("purchase_url", "image_url"):
        payload[field] = values.get(field) or None
    if values.get("currency"):
        payload["currency"] = values["currency"]
    return payload


def check_row(row: CsvRow) -> CheckedRow:
    values = row.values
    payload = _row_payload(values)
    try:
        for field in ("price", "old_price"):
            payload[field] = parse_price(values.get(field, ""))
    except ValueError as error:
        return CheckedRow(None, None, GiftImportRowError(row=row.row, field=field, message=str(error)))
    try:
        payload["is_visible"] = parse_visibility(values.get("is_visible", ""))
    except ValueError as error:
        return CheckedRow(None, None, GiftImportRowError(row=row.row, field="is_visible", message=str(error)))
    category = values.get("category", "")
    if len(category) > MAX_CATEGORY_LENGTH:
        message = f"La catégorie est trop longue (maximum {MAX_CATEGORY_LENGTH} caractères)."
        return CheckedRow(None, None, GiftImportRowError(row=row.row, field="category", message=message))
    try:
        gift = GiftCreate.model_validate(payload)
    except ValidationError as error:
        field_name, message = translate_error(error.errors()[0])
        return CheckedRow(None, None, GiftImportRowError(row=row.row, field=field_name, message=message))
    return CheckedRow(gift, category or None, None)


def _category_key(name: str) -> str:
    return name.strip().casefold()


def import_gifts(db: Session, wishlist: Wishlist, content: str, dry_run: bool) -> GiftImportResult:
    """Validate the whole file; write only when it is a real import and every row is valid."""
    if len(content) > MAX_IMPORT_CHARS:
        raise ServiceError(TOO_LARGE, 413)
    rows = read_rows(content)
    existing: dict[str, Category] = {}
    for category in category_service.list_categories(db, wishlist):
        existing.setdefault(_category_key(category.name), category)
    checked = [check_row(row) for row in rows]
    to_create: dict[str, str] = {}
    for result in checked:
        if result.category and _category_key(result.category) not in existing:
            to_create.setdefault(_category_key(result.category), result.category)
    errors = [result.error for result in checked if result.error is not None]
    summary = GiftImportResult(
        dry_run=dry_run,
        total_rows=len(rows),
        valid_rows=len(rows) - len(errors),
        errors=errors,
        categories_to_create=list(to_create.values()),
    )
    if dry_run or errors:
        return summary
    _write(db, wishlist, checked, existing, to_create)
    summary.created_gifts = len(checked)
    summary.created_categories = len(to_create)
    return summary


def _write(
    db: Session,
    wishlist: Wishlist,
    checked: list[CheckedRow],
    existing: dict[str, Category],
    to_create: dict[str, str],
) -> None:
    """One transaction: new categories after the existing ones, then the gifts in file order."""
    category_position = category_service.next_position(db, wishlist)
    gift_position = gift_service.next_position(db, wishlist)
    categories = dict(existing)
    try:
        for offset, (key, name) in enumerate(to_create.items()):
            category = Category(wishlist_id=wishlist.id, name=name, position=category_position + offset)
            db.add(category)
            categories[key] = category
        db.flush()
        valid = [(result.gift, result.category) for result in checked if result.gift is not None]
        for offset, (payload, category_name) in enumerate(valid):
            gift = Gift(wishlist_id=wishlist.id, position=gift_position + offset)
            gift_service.apply_changes(gift, payload.model_dump())
            if category_name is not None:
                gift.category_id = categories[_category_key(category_name)].id
            db.add(gift)
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise Conflict(IMPORT_CONFLICT) from error

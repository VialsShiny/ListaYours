"""What counts as a success per field when the parser output is compared with a hand-checked page."""

from __future__ import annotations

import re
from typing import Any

FIELDS = [
    "title",
    "price",
    "old_price",
    "currency",
    "description",
    "images>=1",
    "images main",
    "images gallery",
    "brand",
    "availability",
]


def norm(value: Any) -> str:
    """Case, whitespace and punctuation insensitive ('EKTORP Canapé, blanc' equals 'EKTORP Canapé - blanc')."""
    return re.sub(r"[\W_]+", " ", str(value or "")).strip().casefold()


def photo_key(url: Any) -> str:
    """Identity of a photo regardless of a size suffix (Amazon ._AC_SL1500_) or query string: main's URLs still count."""
    return re.sub(r"\._[^./]+_\.", ".", str(url or "").split("?")[0])


def same_photo(expected: Any, actual: Any) -> bool:
    return photo_key(expected) == photo_key(actual)


def same_amount(expected: Any, actual: Any) -> bool:
    if expected is None or actual is None:
        return expected is None and actual is None
    try:
        return abs(float(str(expected).replace(",", ".")) - float(str(actual).replace(",", "."))) < 0.005
    except ValueError:
        return False


def field_matches(field: str, expected: dict[str, Any], actual: dict[str, Any]) -> bool:
    """A field is a success when the value is present and equal to the expectation (null expected: null found).

    The description only has to start the same way (120 characters), because shops truncate or
    append boilerplate differently depending on the source (meta, JSON-LD, visible text).
    """
    if field in ("price", "old_price"):
        return same_amount(expected.get(field), actual.get(field))
    if field == "images>=1":
        return bool(actual.get("images")) == bool(expected.get("images"))
    if field == "images main":
        return same_photo((expected.get("images") or [None])[0], (actual.get("images") or [None])[0])
    if field == "images gallery":
        return {photo_key(url) for url in expected.get("images") or []} == {
            photo_key(url) for url in actual.get("images") or []
        }
    if field == "availability":
        return bool(actual.get("availability")) == bool(expected.get("availability"))
    if field == "description":
        head_expected, head_actual = norm(expected.get(field))[:120], norm(actual.get(field))[:120]
        return bool(head_expected) == bool(head_actual) and head_actual.startswith(head_expected[:80])
    return norm(expected.get(field)) == norm(actual.get(field))

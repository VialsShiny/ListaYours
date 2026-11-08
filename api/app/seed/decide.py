import re
from decimal import Decimal, InvalidOperation
from typing import Any

from app.seed.models import GiftOutcome, SeedGift

BLOCKED_PATTERNS = re.compile(
    r"robot|captcha|oops|something went wrong|access denied|une erreur|page introuvable|service unavailable",
    re.IGNORECASE,
)
MAX_TITLE_IN_DESCRIPTION = 160


def is_blocked(data: dict[str, Any] | None) -> bool:
    """A page counts as blocked when the scraper got no title or a title/description that reads like an error page."""
    if not data or not data.get("title"):
        return True
    haystack = " ".join(str(data.get(key) or "") for key in ("title", "description"))
    return bool(BLOCKED_PATTERNS.search(haystack)) and not data.get("price")


def to_money(value: Any) -> Decimal | None:
    if value in (None, ""):
        return None
    try:
        amount = Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None
    return amount if amount > 0 else None


def decide(gift: SeedGift, data: dict[str, Any] | None, assets_base_url: str) -> GiftOutcome:
    """Scraper values win when complete (price + currency); the PDF price and image are the fallback."""
    outcome = GiftOutcome(name=gift.name, url=gift.url, source="scraper", price=None, currency="EUR", image=None)
    blocked = is_blocked(data)
    scraped: dict[str, Any] = data or {}
    outcome.scraped_title = scraped.get("title") if not blocked else None
    if blocked:
        outcome.flags.append("blocked")

    price = to_money(scraped.get("price")) if not blocked else None
    currency = (scraped.get("currency") or "").upper() if not blocked else ""
    if price is not None and len(currency) == 3:
        outcome.price, outcome.currency = price, currency
    else:
        outcome.price, outcome.currency, outcome.source = gift.pdf_price, "EUR", "pdf"
        outcome.flags.append("pdf_price" if price is None else "pdf_price_currency_unknown")

    old_price = to_money(scraped.get("old_price")) if outcome.source == "scraper" else None
    outcome_old = (
        old_price if old_price is not None and outcome.price is not None and old_price > outcome.price else None
    )

    if gift.pdf_image:
        outcome.image = f"{assets_base_url.rstrip('/')}/seed/{gift.pdf_image}"
        outcome.flags.append("pdf_image")
    else:
        images = [img for img in (scraped.get("images") or []) if isinstance(img, str)] if not blocked else []
        outcome.image = images[0] if images else None
        if outcome.image is None:
            outcome.flags.append("no_image")
    outcome.flags.append(f"old_price={outcome_old}") if outcome_old is not None else None
    return outcome


def old_price_of(outcome: GiftOutcome) -> Decimal | None:
    for flag in outcome.flags:
        if flag.startswith("old_price="):
            return Decimal(flag.split("=", 1)[1])
    return None


def build_description(gift: SeedGift, outcome: GiftOutcome) -> str:
    lines = []
    if gift.note:
        lines.append(gift.note)
    if gift.alt:
        lines.append(gift.alt)
    if outcome.scraped_title:
        title = outcome.scraped_title.strip()
        if len(title) > MAX_TITLE_IN_DESCRIPTION:
            title = title[: MAX_TITLE_IN_DESCRIPTION - 1].rstrip() + "…"
        lines.append(f"Produit : {title}")
    return "\n".join(lines)

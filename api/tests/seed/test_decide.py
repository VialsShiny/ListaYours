from decimal import Decimal

from app.seed.decide import build_description, decide, is_blocked, old_price_of
from app.seed.models import SeedGift

GIFT = SeedGift(category="Les essentiels", name="Moniteur", pdf_price=Decimal("199.00"), url="https://x.test/p")


def test_scraper_values_win_when_complete() -> None:
    data = {
        "title": "AOC 27",
        "price": "197.40",
        "old_price": "229.00",
        "currency": "EUR",
        "images": ["https://img/a.jpg"],
    }
    outcome = decide(GIFT, data, "http://localhost:3000")
    assert outcome.source == "scraper"
    assert (outcome.price, outcome.currency, outcome.image) == (Decimal("197.40"), "EUR", "https://img/a.jpg")
    assert old_price_of(outcome) == Decimal("229.00")
    assert "pdf_price" not in outcome.flags


def test_pdf_price_when_currency_is_unknown() -> None:
    data = {"title": "Spinner", "price": "8.97", "currency": None, "images": ["https://img/s.jpg"]}
    outcome = decide(GIFT, data, "http://localhost:3000")
    assert (outcome.source, outcome.price, outcome.currency) == ("pdf", Decimal("199.00"), "EUR")
    assert "pdf_price_currency_unknown" in outcome.flags
    assert outcome.image == "https://img/s.jpg"


def test_blocked_page_falls_back_to_pdf_values() -> None:
    gift = SeedGift(category="c", name="NB", pdf_price=Decimal("120.00"), url="https://nb.test", pdf_image="nb.jpg")
    outcome = decide(gift, {"title": "Oops! Something went wrong", "price": None}, "https://site.test/")
    assert "blocked" in outcome.flags
    assert (outcome.source, outcome.price, outcome.image) == ("pdf", Decimal("120.00"), "https://site.test/seed/nb.jpg")
    assert outcome.scraped_title is None
    assert is_blocked(None) and is_blocked({"title": None})
    assert not is_blocked({"title": "Robot vacuum cleaner", "price": "99.00"})


def test_old_price_only_when_higher() -> None:
    data = {"title": "Bento", "price": "24.23", "old_price": "17.04", "currency": "USD", "images": []}
    outcome = decide(GIFT, data, "http://localhost:3000")
    assert old_price_of(outcome) is None
    assert "no_image" in outcome.flags


def test_description_combines_note_alt_and_title() -> None:
    gift = SeedGift(
        category="c",
        name="Pull",
        pdf_price=Decimal("62.95"),
        url="https://s.test",
        note="Taille M",
        alt="Au choix avec : X",
    )
    outcome = decide(gift, {"title": "x" * 200, "price": "100", "currency": "AUD", "images": []}, "http://l")
    description = build_description(gift, outcome)
    assert description.startswith("Taille M\nAu choix avec : X\nProduit : ")
    assert description.endswith("…")

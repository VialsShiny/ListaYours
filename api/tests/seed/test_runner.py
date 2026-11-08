from decimal import Decimal
from pathlib import Path

import pytest
from sqlalchemy import func, select

from app.db.models import Category, Gift, User, Wishlist
from app.seed import runner
from app.seed.models import load_seed

SEED_FILE = Path(__file__).resolve().parents[2] / "seed" / "wishlist.json"


@pytest.fixture
def fake_scraper(monkeypatch):
    async def fake(url: str, strategy: str, debug: bool):
        if "newbalance" in url:
            return {"title": "Oops! Something went wrong", "price": None}, "PLAYWRIGHT"
        return {
            "title": f"Produit {url[-6:]}",
            "price": "10.00",
            "currency": "EUR",
            "images": [f"{url}/img.jpg"],
        }, "HTTPX"

    monkeypatch.setattr(runner, "scrape_with_guards", fake)


def test_seed_file_has_all_23_gifts_in_8_categories() -> None:
    seed = load_seed(SEED_FILE)
    assert len(seed.gifts) == 23
    assert len(seed.categories) == 8
    assert {gift.category for gift in seed.gifts} == set(seed.categories)
    assert len({gift.url for gift in seed.gifts}) == 23


def test_seed_is_idempotent_and_uses_fallbacks(db, monkeypatch, fake_scraper) -> None:
    monkeypatch.setenv("OWNER_EMAIL", "owner@listayours-test.fr")
    monkeypatch.setenv("OWNER_PASSWORD", "motdepasse-seed-123")
    seed = load_seed(SEED_FILE)

    outcomes = runner.run_seed_sync(db, seed, "http://localhost:3000")
    assert len(outcomes) == 23
    blocked = [o for o in outcomes if "blocked" in o.flags]
    assert [o.name for o in blocked] == ["New Balance 740 noire"]
    assert blocked[0].price == Decimal("120.00")
    assert blocked[0].image == "http://localhost:3000/seed/new-balance-740-noire.jpg"

    owner = db.scalar(select(User).where(User.email == "owner@listayours-test.fr"))
    assert owner is not None and owner.role == "owner"
    wishlist = db.scalar(select(Wishlist).where(Wishlist.owner_id == owner.id))
    assert wishlist is not None and wishlist.title == "Liste de Souhait" and wishlist.slug == "liste-de-souhait"
    assert db.scalar(select(func.count()).select_from(Gift)) == 23
    assert db.scalar(select(func.count()).select_from(Category)) == 8

    runner.run_seed_sync(db, seed, "http://localhost:3000")
    assert db.scalar(select(func.count()).select_from(Gift)) == 23
    assert db.scalar(select(func.count()).select_from(Category)) == 8

    keyboard = db.scalar(select(Gift).where(Gift.name.like("Clavier%")))
    assert keyboard is not None
    assert keyboard.image_url == "http://localhost:3000/seed/clavier-touches-blanches.jpg"
    assert "touches blanches" in keyboard.description
    cutlery = db.scalar(select(Gift).where(Gift.name.like("Couverts%")))
    assert cutlery is not None and "Avec ou sans : Lunch box" in cutlery.description


def test_seed_without_network_uses_pdf_prices(db, monkeypatch) -> None:
    monkeypatch.setenv("OWNER_EMAIL", "owner@listayours-test.fr")
    monkeypatch.setenv("OWNER_PASSWORD", "motdepasse-seed-123")
    outcomes = runner.run_seed_sync(db, load_seed(SEED_FILE), "http://localhost:3000", scrape=False)
    assert all(o.source == "pdf" and "scrape_skipped" in o.flags for o in outcomes)
    assert sum(1 for o in outcomes if o.image) == 2

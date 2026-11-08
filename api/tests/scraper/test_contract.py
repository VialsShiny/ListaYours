import pytest

from app.models import ProductData, ScrapeRequest, ScrapeResponse
from app.scraper.constants.keywords import BUY_KEYWORDS, OUT_OF_STOCK_KEYWORDS
from app.scraper.utils.parsing import parse_count, parse_price, parse_rating
from app.scraper.utils.url import PW_DOMAINS, get_url_domain, is_require_pw_domain


def test_product_data_field_names() -> None:
    assert list(ProductData.model_fields) == [
        "product_url",
        "canonical_url",
        "title",
        "price",
        "old_price",
        "discount",
        "currency",
        "description",
        "images",
        "gallery",
        "brand",
        "sku",
        "availability",
        "stock",
        "category",
        "variants",
        "characteristics",
        "reviews",
    ]
    assert list(ScrapeResponse.model_fields) == ["success", "data", "error", "strategy_used", "debug"]
    assert list(ScrapeRequest.model_fields) == ["url", "strategy", "debug"]


def test_keyword_lists_are_frozen() -> None:
    assert OUT_OF_STOCK_KEYWORDS == [
        "stock épuisé",
        "temporairement indisponible",
        "bientôt disponible",
        "out of stock",
    ]
    assert BUY_KEYWORDS == [
        "passer commande",
        "finaliser l'achat",
        "valider l'achat",
        "faire une offre",
        "ajouter au panier",
        "ajouter au sac",
        "options d'achat",
        "buy now",
        "shop now",
        "order now",
        "complete purchase",
        "add to cart",
        "add to bag",
        "buying options",
    ]


def test_playwright_domains_are_frozen() -> None:
    assert PW_DOMAINS == ["aliexpress.com", "www.aliexpress.com", "fr.aliexpress.com"]
    assert is_require_pw_domain("https://fr.aliexpress.com/item/1.html") is True
    assert is_require_pw_domain("https://www.amazon.fr/dp/B0CZ762XQ3") is False
    assert get_url_domain("https://www.amazon.fr/dp/B0CZ762XQ3") == "www.amazon.fr"


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (None, None),
        (199, "199"),
        (34.9, "34.9"),
        ("199,00 €", "199.00"),
        ("1 234,56 €", "1234.56"),
        ("$1,299.99", "1299.99"),
        ("62.95", "62.95"),
        ("Prix : 24,39€", "24.39"),
        ("abc", None),
        ("€", None),
        ("12", "12"),
    ],
)
def test_parse_price(raw, expected) -> None:
    assert parse_price(raw) == expected


def test_parse_rating_and_count() -> None:
    assert parse_rating("4,6 sur 5") == 4.6
    assert parse_rating("") is None
    assert parse_count("1 234 avis") == 1234
    assert parse_count("aucun") is None

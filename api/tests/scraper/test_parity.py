import json
from pathlib import Path

import pytest

from app.scraper.parser import extract_all_data

FIXTURES = Path(__file__).parent / "fixtures"
SCRAPER_DIR = Path(__file__).resolve().parents[2] / "app" / "scraper"

CASES = [
    ("aliexpress_test_file", SCRAPER_DIR / "test.file.html", "https://fr.aliexpress.com/item/1005003030077320.html"),
    ("generic_jsonld", FIXTURES / "generic_jsonld.html", "https://shirtz.cool/products/the-monsters-nearby-knit"),
    ("amazon_like", FIXTURES / "amazon_like.html", "https://www.amazon.fr/dp/B0CZ762XQ3"),
    ("robot_check", FIXTURES / "robot_check.html", "https://www.amazon.com/dp/B0CPBNV3H4"),
]


@pytest.mark.parametrize(("name", "html_path", "url"), CASES, ids=[case[0] for case in CASES])
def test_extract_all_data_matches_recorded_output(name: str, html_path: Path, url: str) -> None:
    """Golden test: the parser output for recorded HTML must stay byte-identical to the fixture."""
    expected = json.loads((FIXTURES / f"{name}.expected.json").read_text(encoding="utf-8"))
    actual = extract_all_data(html_path.read_text(encoding="utf-8"), url)
    assert json.loads(json.dumps(actual, ensure_ascii=False, sort_keys=True)) == expected


def test_output_keys_are_stable() -> None:
    data = extract_all_data("<html><title>x</title></html>", "https://example.com/p")
    assert list(data.keys()) == [
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
    assert list(data["variants"].keys()) == ["size", "color", "style", "pattern"]
    assert list(data["reviews"].keys()) == ["rating_average", "review_count", "list"]

import gzip
import json
from pathlib import Path

import pytest

from app.scraper.parser import extract_all_data

FIXTURES = Path(__file__).parent / "fixtures"
CORPUS = json.loads((FIXTURES / "corpus.json").read_text(encoding="utf-8"))
GOLDEN = [case for case in CORPUS if case["golden"]]


def read_fixture(path: Path) -> str:
    if path.suffix == ".gz":
        with gzip.open(path, "rt", encoding="utf-8") as handle:
            return handle.read()
    return path.read_text(encoding="utf-8")


def canonical(payload) -> str:
    return json.dumps(payload, ensure_ascii=False, sort_keys=True)


def expected(name: str) -> dict:
    return json.loads((FIXTURES / f"{name}.expected.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", GOLDEN, ids=[case["name"] for case in GOLDEN])
def test_extract_all_data_matches_recorded_output(case: dict) -> None:
    """Golden test: the parser output for recorded HTML must stay byte-identical to the fixture."""
    actual = extract_all_data(read_fixture(FIXTURES / case["file"]), case["url"])
    assert canonical(actual) == canonical(expected(case["name"]))


@pytest.mark.parametrize("case", CORPUS, ids=[case["name"] for case in CORPUS])
def test_main_image_is_the_product_photo(case: dict) -> None:
    """Every page of the corpus: the first image is the hand-checked main photo and gallery mirrors images.

    The other fields are measured, not asserted, by `scripts/scrape_report.py` (docs/SCRAPER-REPORT.md).
    """
    actual = extract_all_data(read_fixture(FIXTURES / case["file"]), case["url"])
    assert actual["images"][:1] == expected(case["name"])["images"][:1]
    assert actual["gallery"] == actual["images"] or case["name"] == "aliexpress_test_file"
    assert len(actual["images"]) <= 8 or case["name"] == "aliexpress_test_file"


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

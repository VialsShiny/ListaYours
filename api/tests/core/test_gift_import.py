"""Parsing side of the CSV import: delimiters, BOM, headers, value formats and row-level errors."""

import pytest

from app.services.csv_rows import detect_delimiter, normalize_header, parse_price, parse_visibility
from tests.core.import_helpers import import_csv, owner_gifts


def test_comma_file_is_imported_in_file_order(client, owner) -> None:
    content = "name,price,url\nCasque,59.90,https://shop.example.com/casque\nLivre,12,\n"
    response = import_csv(client, owner, content)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body == {
        "dry_run": False,
        "total_rows": 2,
        "valid_rows": 2,
        "errors": [],
        "categories_to_create": [],
        "created_gifts": 2,
        "created_categories": 0,
    }
    gifts = owner_gifts(client, owner)
    assert [(g["name"], g["price"], g["position"]) for g in gifts] == [("Casque", "59.90", 0), ("Livre", "12.00", 1)]
    assert gifts[0]["purchase_url"] == "https://shop.example.com/casque"
    assert gifts[1]["purchase_url"] is None
    assert gifts[0]["currency"] == "EUR"


def test_semicolon_file_with_bom_and_french_accented_headers(client, owner) -> None:
    content = (
        "﻿ Nom ;Détails;PRIX;Ancien prix;Devise;Lien;Photo;Catégorie;Visible;Inconnue\r\n"
        "Lampe;Pour le bureau;1 299,00;1.499,50;usd;https://a.example.com/l;https://img.example.com/l.jpg;Maison;non;x\r\n"
        "\r\n"
        "Tasse;;12 €;€15;;;;;oui;\r\n"
    )
    response = import_csv(client, owner, content)
    assert response.status_code == 201, response.text
    assert response.json()["total_rows"] == 2
    lampe, tasse = owner_gifts(client, owner)
    assert lampe["name"] == "Lampe" and lampe["description"] == "Pour le bureau"
    assert (lampe["price"], lampe["old_price"], lampe["currency"]) == ("1299.00", "1499.50", "USD")
    assert lampe["image_url"] == "https://img.example.com/l.jpg"
    assert lampe["is_visible"] is False and lampe["category_id"] is not None
    assert (tasse["price"], tasse["old_price"], tasse["is_visible"]) == ("12.00", "15.00", True)
    assert tasse["category_id"] is None


def test_tab_separated_file(client, owner) -> None:
    response = import_csv(client, owner, "titre\tprix\nVélo\t250,5\n")
    assert response.status_code == 201, response.text
    assert owner_gifts(client, owner)[0]["price"] == "250.50"


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("12,50", "12.50"),
        ("12.50", "12.50"),
        ("1 299,00", "1299.00"),
        ("1 299,00", "1299.00"),
        ("12 €", "12"),
        ("€12", "12"),
        ("1,299.00", "1299.00"),
        ("", None),
        ("  ", None),
    ],
)
def test_price_formats(raw: str, expected: str | None) -> None:
    assert parse_price(raw) == expected


@pytest.mark.parametrize("raw", ["douze", "12,5,0", "12€50x", "1.2.3"])
def test_unreadable_prices(raw: str) -> None:
    with pytest.raises(ValueError):
        parse_price(raw)


def test_visibility_and_header_helpers() -> None:
    assert [parse_visibility(v) for v in ("", "Oui", "YES", "true", "1", "vrai")] == [True] * 6
    assert [parse_visibility(v) for v in ("non", "No", "false", "0", "FAUX")] == [False] * 5
    with pytest.raises(ValueError):
        parse_visibility("peut-être")
    assert normalize_header("  Catégorie ") == "categorie"
    assert normalize_header("Ancien_Prix") == normalize_header("ancien  prix")
    assert detect_delimiter("nom") == ","
    assert detect_delimiter("nom;prix") == ";"


def test_row_errors_are_reported_in_french_with_row_and_field(client, owner) -> None:
    content = (
        "nom,prix,lien,devise,visible,categorie\n"
        "Bon,10,,,,\n"
        ",10,,,,\n"
        "Prix faux,abc,,,,\n"
        "Lien faux,1,ftp://x.example.com,,,\n"
        "Devise fausse,1,,EURO,,\n"
        "Visibilité,1,,,peut-être,\n"
        f"Catégorie,1,,,,{'c' * 81}\n"
        f"{'n' * 201},1,,,,\n"
        "Négatif,-3,,,,\n"
    )
    response = import_csv(client, owner, content, dry_run=True)
    assert response.status_code == 200, response.text
    body = response.json()
    assert (body["total_rows"], body["valid_rows"]) == (9, 1)
    by_row = {error["row"]: error for error in body["errors"]}
    assert sorted(by_row) == [2, 3, 4, 5, 6, 7, 8, 9]
    assert by_row[2] == {"row": 2, "field": "name", "message": "Le nom est obligatoire."}
    assert by_row[3]["field"] == "price" and "prix valide" in by_row[3]["message"]
    assert by_row[4]["field"] == "purchase_url" and "http" in by_row[4]["message"]
    assert by_row[5]["field"] == "currency" and "trois lettres" in by_row[5]["message"]
    assert by_row[6]["field"] == "is_visible"
    assert by_row[7]["field"] == "category" and "80" in by_row[7]["message"]
    assert by_row[8]["field"] == "name" and "200" in by_row[8]["message"]
    assert by_row[9]["field"] == "price" and "négatif" in by_row[9]["message"]


def test_row_numbers_count_blank_lines_and_exclude_header(client, owner) -> None:
    response = import_csv(client, owner, "nom,prix\nA,1\n\n,2\n", dry_run=True)
    assert response.json()["errors"] == [{"row": 3, "field": "name", "message": "Le nom est obligatoire."}]
    assert response.json()["total_rows"] == 2


def test_missing_name_column_lists_found_headers(client, owner) -> None:
    response = import_csv(client, owner, "prix;lien\n12;\n")
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "nom" in detail and "« prix »" in detail and "« lien »" in detail


@pytest.mark.parametrize("content", ["", "   \n", "\nnom\nA\n"])
def test_empty_or_headerless_files_are_refused(client, owner, content: str) -> None:
    response = import_csv(client, owner, content)
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)


def test_nul_characters_are_refused(client, owner) -> None:
    assert import_csv(client, owner, "nom\nA\x00B\n").status_code == 422

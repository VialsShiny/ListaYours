"""Write side of the CSV import: dry runs, all-or-nothing, categories, limits and access control."""

from app.limits import IMPORT_LIMIT_PER_MINUTE
from app.schemas.gift_import import MAX_IMPORT_CHARS, MAX_IMPORT_ROWS
from tests.conftest import auth_headers
from tests.core.helpers import create_category, create_gift
from tests.core.import_helpers import IMPORT_URL, import_csv, owner_categories, owner_gifts


def test_dry_run_writes_nothing(client, owner) -> None:
    response = import_csv(client, owner, "nom,catégorie\nA,Jeux\nB,Livres\n", dry_run=True)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["dry_run"] is True
    assert (body["total_rows"], body["valid_rows"], body["created_gifts"], body["created_categories"]) == (2, 2, 0, 0)
    assert body["categories_to_create"] == ["Jeux", "Livres"]
    assert owner_gifts(client, owner) == []
    assert owner_categories(client, owner) == []


def test_invalid_row_rejects_the_whole_import(client, owner) -> None:
    create_gift(client, owner, "Déjà là")
    response = import_csv(client, owner, "nom,prix,catégorie\nA,1,Neuve\nB,pas un prix,Neuve\nC,3,\n")
    assert response.status_code == 422
    body = response.json()
    assert body["dry_run"] is False and body["created_gifts"] == 0
    assert [(e["row"], e["field"]) for e in body["errors"]] == [(2, "price")]
    assert [g["name"] for g in owner_gifts(client, owner)] == ["Déjà là"]
    assert owner_categories(client, owner) == []


def test_categories_are_reused_case_insensitively_and_created_in_order(client, owner) -> None:
    existing = create_category(client, owner, "Livres")
    create_gift(client, owner, "Ancien")
    content = "nom,catégorie\nA,  livres \nB,Jeux\nC,JEUX\nD,Cuisine\nE,\nA,Livres\n"
    preview = import_csv(client, owner, content, dry_run=True).json()
    assert preview["categories_to_create"] == ["Jeux", "Cuisine"]
    response = import_csv(client, owner, content)
    assert response.status_code == 201, response.text
    assert (response.json()["created_gifts"], response.json()["created_categories"]) == (6, 2)
    categories = owner_categories(client, owner)
    assert [(c["name"], c["position"]) for c in categories] == [("Livres", 0), ("Jeux", 1), ("Cuisine", 2)]
    ids = {c["name"]: c["id"] for c in categories}
    gifts = owner_gifts(client, owner)
    assert [(g["name"], g["position"]) for g in gifts] == [
        ("Ancien", 0),
        ("A", 1),
        ("B", 2),
        ("C", 3),
        ("D", 4),
        ("E", 5),
        ("A", 6),
    ]
    assert [g["category_id"] for g in gifts[1:]] == [
        existing["id"],
        ids["Jeux"],
        ids["Jeux"],
        ids["Cuisine"],
        None,
        existing["id"],
    ]


def test_visitor_and_anonymous_callers_are_refused(client, owner, visitor) -> None:
    body = {"content": "nom\nA\n"}
    assert client.post(IMPORT_URL, json=body, headers=auth_headers(visitor["access_token"])).status_code == 403
    assert client.post(IMPORT_URL, json=body).status_code == 401
    assert owner_gifts(client, owner) == []


def test_row_limit(client, owner) -> None:
    header = "nom\n"
    accepted = import_csv(client, owner, header + "Cadeau\n" * MAX_IMPORT_ROWS, dry_run=True)
    assert accepted.status_code == 200 and accepted.json()["total_rows"] == MAX_IMPORT_ROWS
    refused = import_csv(client, owner, header + "Cadeau\n" * (MAX_IMPORT_ROWS + 1))
    assert refused.status_code == 422
    assert "500" in refused.json()["detail"]
    assert owner_gifts(client, owner) == []


def test_over_long_content_is_refused(client, owner) -> None:
    content = "nom\n" + "x" * MAX_IMPORT_CHARS
    response = import_csv(client, owner, content, dry_run=True)
    assert response.status_code == 413
    assert "volumineux" in response.json()["detail"]


def test_import_is_rate_limited_per_owner(client, owner) -> None:
    for _ in range(IMPORT_LIMIT_PER_MINUTE):
        assert import_csv(client, owner, "nom\nA\n", dry_run=True).status_code == 200
    limited = import_csv(client, owner, "nom\nA\n", dry_run=True)
    assert limited.status_code == 429
    assert "Trop de requêtes" in limited.json()["detail"]


def test_dry_run_defaults_to_false(client, owner) -> None:
    response = client.post(IMPORT_URL, json={"content": "nom\nA\n"}, headers=auth_headers(owner["access_token"]))
    assert response.status_code == 201
    assert response.json()["dry_run"] is False and len(owner_gifts(client, owner)) == 1

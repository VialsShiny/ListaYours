from fastapi.testclient import TestClient

from tests.core.helpers import owner_headers

IMPORT_URL = "/api/owner/gifts/import"


def import_csv(client: TestClient, owner: dict, content: str, dry_run: bool = False):
    return client.post(IMPORT_URL, json={"content": content, "dry_run": dry_run}, headers=owner_headers(owner))


def owner_gifts(client: TestClient, owner: dict) -> list[dict]:
    response = client.get("/api/owner/gifts", headers=owner_headers(owner))
    assert response.status_code == 200, response.text
    return response.json()


def owner_categories(client: TestClient, owner: dict) -> list[dict]:
    response = client.get("/api/owner/categories", headers=owner_headers(owner))
    assert response.status_code == 200, response.text
    return response.json()

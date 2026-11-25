from fastapi.testclient import TestClient

from app.main import docs_options


def test_docs_disabled_in_production() -> None:
    assert docs_options(True) == {"docs_url": None, "redoc_url": None, "openapi_url": None}


def test_docs_enabled_outside_production() -> None:
    assert docs_options(False) == {"docs_url": "/docs", "redoc_url": "/redoc", "openapi_url": "/openapi.json"}


def test_test_environment_still_serves_openapi(client: TestClient) -> None:
    assert client.get("/openapi.json").status_code == 200

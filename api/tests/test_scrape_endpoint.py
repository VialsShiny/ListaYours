from fastapi.testclient import TestClient

from app import main
from app.scraper.parser import extract_all_data

HTML = "<html><head><title>Produit</title></head><body><h1>Produit</h1><span class='price'>12,50 €</span></body></html>"


def test_scrape_endpoint_response_shape(monkeypatch) -> None:
    async def fake_scrape(url: str, strategy: str, debug: bool):
        return extract_all_data(HTML, url), "HTTPX"

    monkeypatch.setattr(main, "scrape_product", fake_scrape)
    client = TestClient(main.app)
    response = client.post("/api/scrape", json={"url": "https://example.com/p", "strategy": "HTTPX", "debug": False})
    assert response.status_code == 200
    body = response.json()
    assert list(body.keys()) == ["success", "data", "error", "strategy_used", "debug"]
    assert body["success"] is True
    assert body["strategy_used"] == "HTTPX"
    assert body["data"]["title"] == "Produit"
    assert body["data"]["price"] == "12.50"
    assert body["data"]["product_url"] == "https://example.com/p"


def test_scrape_endpoint_reports_errors_as_success_false(monkeypatch) -> None:
    async def failing(url: str, strategy: str, debug: bool):
        raise RuntimeError("boom")

    monkeypatch.setattr(main, "scrape_product", failing)
    client = TestClient(main.app)
    response = client.post("/api/scrape", json={"url": "https://example.com/p", "debug": True})
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is False
    assert body["error"] == "boom"
    assert body["data"] is None
    assert body["strategy_used"] is None
    assert body["debug"] is True


def test_health() -> None:
    assert TestClient(main.app).get("/health").json() == {"status": "ok"}

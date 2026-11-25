import pytest

from app.config import DEV_JWT_SECRET, load_settings

PRODUCTION_ENV = {
    "ENVIRONMENT": "production",
    "JWT_SECRET": "x" * 32,
    "OWNER_EMAIL": "Me@Example.org",
    "API_PROXY_SECRET": "p" * 32,
    "CORS_ORIGINS": "https://listayours.example",
}


@pytest.fixture
def production(monkeypatch: pytest.MonkeyPatch) -> pytest.MonkeyPatch:
    for name, value in PRODUCTION_ENV.items():
        monkeypatch.setenv(name, value)
    return monkeypatch


def test_production_accepts_a_complete_configuration(production: pytest.MonkeyPatch) -> None:
    settings = load_settings()
    assert settings.is_production is True
    assert settings.owner_email == "me@example.org"
    assert settings.trust_proxy_headers is False
    assert settings.cors_origins == ["https://listayours.example"]


@pytest.mark.parametrize(
    ("name", "value"),
    [
        ("JWT_SECRET", "short"),
        ("JWT_SECRET", ""),
        ("OWNER_EMAIL", ""),
        ("API_PROXY_SECRET", ""),
        ("API_PROXY_SECRET", "p" * 31),
        ("CORS_ORIGINS", "*"),
        ("CORS_ORIGINS", "https://listayours.example, http://localhost:3000"),
    ],
)
def test_production_refuses_an_unsafe_value(production: pytest.MonkeyPatch, name: str, value: str) -> None:
    production.setenv(name, value)
    with pytest.raises(RuntimeError):
        load_settings()


@pytest.mark.parametrize("environment", ["staging", "preview", "prod", "Production"])
def test_other_environments_need_a_real_jwt_secret(monkeypatch: pytest.MonkeyPatch, environment: str) -> None:
    monkeypatch.setenv("ENVIRONMENT", environment)
    monkeypatch.delenv("JWT_SECRET", raising=False)
    with pytest.raises(RuntimeError):
        load_settings()
    monkeypatch.setenv("JWT_SECRET", "y" * 32)
    assert load_settings().jwt_secret == "y" * 32


@pytest.mark.parametrize("environment", ["development", "test"])
def test_development_falls_back_to_a_dev_secret(monkeypatch: pytest.MonkeyPatch, environment: str) -> None:
    monkeypatch.setenv("ENVIRONMENT", environment)
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.setenv("CORS_ORIGINS", "http://a.test, http://b.test")
    settings = load_settings()
    assert settings.jwt_secret == DEV_JWT_SECRET
    assert settings.cors_origins == ["http://a.test", "http://b.test"]

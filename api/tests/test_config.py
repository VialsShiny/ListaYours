import pytest

from app.config import load_settings


def test_production_requires_a_strong_jwt_secret(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("JWT_SECRET", "short")
    with pytest.raises(RuntimeError):
        load_settings()
    monkeypatch.setenv("JWT_SECRET", "x" * 32)
    monkeypatch.delenv("OWNER_EMAIL", raising=False)
    with pytest.raises(RuntimeError):
        load_settings()
    monkeypatch.setenv("OWNER_EMAIL", "Me@Example.org")
    settings = load_settings()
    assert settings.is_production is True
    assert settings.owner_email == "me@example.org"
    assert settings.trust_proxy_headers is False


def test_development_falls_back_to_a_dev_secret(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.setenv("CORS_ORIGINS", "http://a.test, http://b.test")
    settings = load_settings()
    assert len(settings.jwt_secret) >= 32
    assert settings.cors_origins == ["http://a.test", "http://b.test"]

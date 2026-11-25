import os
from dataclasses import dataclass
from functools import lru_cache

DEV_JWT_SECRET = "dev-only-insecure-secret-change-me-32chars"
MIN_JWT_SECRET_LENGTH = 32
MIN_PROXY_SECRET_LENGTH = 32
DEV_ENVIRONMENTS = frozenset({"development", "test"})


def _csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    environment: str
    database_url: str
    jwt_secret: str
    jwt_expires_minutes: int
    owner_email: str
    cors_origins: list[str]
    scrape_timeout_seconds: float
    scrape_cache_ttl_seconds: int
    rate_limit_per_minute: int
    trust_proxy_headers: bool
    proxy_secret: str

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


def _check_production(jwt_secret: str, owner_email: str, proxy_secret: str, cors_origins: list[str]) -> None:
    if not owner_email:
        raise RuntimeError("OWNER_EMAIL must be set in production")
    if len(proxy_secret) < MIN_PROXY_SECRET_LENGTH:
        raise RuntimeError(
            f"API_PROXY_SECRET must be set and at least {MIN_PROXY_SECRET_LENGTH} characters in production"
        )
    for origin in cors_origins:
        if "*" in origin or "localhost" in origin.lower():
            raise RuntimeError(f"CORS_ORIGINS must list the real site origins in production, not {origin!r}")


def load_settings() -> Settings:
    """Read configuration from the environment and fail closed.

    The development JWT secret is used only in the development and test environments; any other
    environment needs a strong JWT_SECRET, and production also needs OWNER_EMAIL, a strong
    API_PROXY_SECRET and explicit CORS origins.
    """
    environment = os.getenv("ENVIRONMENT", "development")
    jwt_secret = os.getenv("JWT_SECRET", "")
    if environment not in DEV_ENVIRONMENTS and len(jwt_secret) < MIN_JWT_SECRET_LENGTH:
        raise RuntimeError(
            f"JWT_SECRET must be set and at least {MIN_JWT_SECRET_LENGTH} characters outside development"
        )
    if not jwt_secret:
        jwt_secret = DEV_JWT_SECRET
    owner_email = os.getenv("OWNER_EMAIL", "").strip().lower()
    cors_origins = _csv(os.getenv("CORS_ORIGINS", "http://localhost:3000"))
    proxy_secret = os.getenv("API_PROXY_SECRET", "").strip()
    if environment == "production":
        _check_production(jwt_secret, owner_email, proxy_secret, cors_origins)
    return Settings(
        environment=environment,
        database_url=os.getenv("DATABASE_URL", "sqlite:///./listayours.db"),
        jwt_secret=jwt_secret,
        jwt_expires_minutes=int(os.getenv("JWT_EXPIRES_MINUTES", "10080")),
        owner_email=owner_email or "owner@example.com",
        cors_origins=cors_origins,
        scrape_timeout_seconds=float(os.getenv("SCRAPE_TIMEOUT_SECONDS", "90")),
        scrape_cache_ttl_seconds=int(os.getenv("SCRAPE_CACHE_TTL_SECONDS", "300")),
        rate_limit_per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", "20")),
        trust_proxy_headers=os.getenv("TRUST_PROXY_HEADERS", "false").lower() in {"1", "true", "yes"},
        proxy_secret=proxy_secret,
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return load_settings()

import os
from dataclasses import dataclass
from functools import lru_cache

DEV_JWT_SECRET = "dev-only-insecure-secret-change-me-32chars"
MIN_JWT_SECRET_LENGTH = 32


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

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


def load_settings() -> Settings:
    """Read configuration from the environment; refuse to start in production without a real JWT secret."""
    environment = os.getenv("ENVIRONMENT", "development")
    jwt_secret = os.getenv("JWT_SECRET", "")
    if environment == "production" and len(jwt_secret) < MIN_JWT_SECRET_LENGTH:
        raise RuntimeError(f"JWT_SECRET must be set and at least {MIN_JWT_SECRET_LENGTH} characters in production")
    if not jwt_secret:
        jwt_secret = DEV_JWT_SECRET
    return Settings(
        environment=environment,
        database_url=os.getenv("DATABASE_URL", "sqlite:///./listayours.db"),
        jwt_secret=jwt_secret,
        jwt_expires_minutes=int(os.getenv("JWT_EXPIRES_MINUTES", "10080")),
        owner_email=os.getenv("OWNER_EMAIL", "owner@example.com").strip().lower(),
        cors_origins=_csv(os.getenv("CORS_ORIGINS", "http://localhost:3000")),
        scrape_timeout_seconds=float(os.getenv("SCRAPE_TIMEOUT_SECONDS", "90")),
        scrape_cache_ttl_seconds=int(os.getenv("SCRAPE_CACHE_TTL_SECONDS", "300")),
        rate_limit_per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", "20")),
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return load_settings()

"""Rate limiters, one instance per budget so that one kind of call never starves another."""

from fastapi import Request

from app.config import get_settings
from app.utils.rate_limit import SlidingWindowLimiter, enforce, too_many_requests

LOGIN_EMAIL_LIMIT = 10
LOGIN_EMAIL_WINDOW_SECONDS = 15 * 60
RESERVATION_LIMIT_PER_MINUTE = 30
IMPORT_LIMIT_PER_MINUTE = 10

_per_minute = get_settings().rate_limit_per_minute
login_limiter = SlidingWindowLimiter(limit=_per_minute)
login_email_limiter = SlidingWindowLimiter(limit=LOGIN_EMAIL_LIMIT, window_seconds=LOGIN_EMAIL_WINDOW_SECONDS)
register_limiter = SlidingWindowLimiter(limit=_per_minute)
account_limiter = SlidingWindowLimiter(limit=_per_minute)
reservation_limiter = SlidingWindowLimiter(limit=RESERVATION_LIMIT_PER_MINUTE)
scrape_limiter = SlidingWindowLimiter(limit=_per_minute)
import_limiter = SlidingWindowLimiter(limit=IMPORT_LIMIT_PER_MINUTE)

ALL_LIMITERS = (
    login_limiter,
    login_email_limiter,
    register_limiter,
    account_limiter,
    reservation_limiter,
    scrape_limiter,
    import_limiter,
)


def reset_all() -> None:
    for limiter in ALL_LIMITERS:
        limiter.reset()


def login_rate_limit(request: Request) -> None:
    enforce(login_limiter, request, "login", get_settings().trust_proxy_headers)


def register_rate_limit(request: Request) -> None:
    enforce(register_limiter, request, "register", get_settings().trust_proxy_headers)


def account_rate_limit(request: Request) -> None:
    enforce(account_limiter, request, "account", get_settings().trust_proxy_headers)


def check_login_email(email: str) -> None:
    """Budget login attempts per target e-mail, so rotating client addresses does not allow guessing."""
    if not login_email_limiter.allow(f"login-email:{email.strip().lower()}"):
        raise too_many_requests()

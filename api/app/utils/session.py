from fastapi import Request, Response

from app.config import Settings

SESSION_COOKIE = "listayours_session"
HOST_PREFIXED_COOKIE = "__Host-listayours_session"


def cookie_name(settings: Settings) -> str:
    """`__Host-` prefix in production: the browser then refuses the cookie unless it is Secure, Path=/ and domain-less."""
    return HOST_PREFIXED_COOKIE if settings.is_production else SESSION_COOKIE


def read_session_cookie(request: Request, settings: Settings) -> str | None:
    return request.cookies.get(cookie_name(settings))


def set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=cookie_name(settings),
        value=token,
        max_age=settings.jwt_expires_minutes * 60,
        path="/",
        secure=settings.is_production,
        httponly=True,
        samesite="lax",
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=cookie_name(settings), path="/", secure=settings.is_production, httponly=True, samesite="lax"
    )


def is_browser_request(request: Request) -> bool:
    """Browsers send `Sec-Fetch-Site` or `Origin` on these calls; command-line clients usually send neither."""
    return "sec-fetch-site" in request.headers or "origin" in request.headers

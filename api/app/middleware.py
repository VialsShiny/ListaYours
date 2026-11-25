"""Request-level guards: the frontend proxy handshake and CSRF checks for cookie-authenticated calls."""

import secrets
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse

from app.config import Settings
from app.utils.session import read_session_cookie

PROXY_SECRET_HEADER = "x-proxy-secret"
CLIENT_IP_HEADER = "x-client-ip"
OPEN_PATHS = {"/health"}
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
SAME_SITE_VALUES = {"same-origin", "same-site", "none"}
SESSION_CREATING_PATHS = {"/api/auth/login", "/api/auth/register"}

Next = Callable[[Request], Awaitable[Response]]


def _forbidden(message: str) -> Response:
    return JSONResponse(status_code=403, content={"detail": message})


def proxy_gate(settings: Settings) -> Callable[[Request, Next], Awaitable[Response]]:
    """When API_PROXY_SECRET is set, only the frontend proxy may call the API; it also carries the real client IP."""

    async def middleware(request: Request, call_next: Next) -> Response:
        if not settings.proxy_secret or request.url.path in OPEN_PATHS:
            return await call_next(request)
        presented = request.headers.get(PROXY_SECRET_HEADER, "")
        if not secrets.compare_digest(presented.encode(), settings.proxy_secret.encode()):
            return _forbidden("Accès réservé au site.")
        client_ip = request.headers.get(CLIENT_IP_HEADER, "").split(",")[0].strip()
        if client_ip:
            request.scope["client"] = (client_ip, 0)
        return await call_next(request)

    return middleware


def _same_site_signal(request: Request, allowed_origins: set[str]) -> bool | None:
    """True when the browser vouches for a same-site request, False when it reports cross-site, None without browser headers."""
    fetch_site = request.headers.get("sec-fetch-site")
    if fetch_site is not None:
        return fetch_site in SAME_SITE_VALUES
    origin = request.headers.get("origin")
    if origin is not None:
        return origin in allowed_origins
    return None


def csrf_guard(settings: Settings) -> Callable[[Request, Next], Awaitable[Response]]:
    """State-changing requests must come from the site itself.

    A request authenticated by the session cookie needs a positive same-site signal (`Sec-Fetch-Site`,
    else `Origin`); a bare request with neither header is refused. Login and register, which create a
    session instead of using one, are refused only on an explicit cross-site signal, so command-line
    clients keep working while login CSRF from another site is blocked. Bearer calls are not ambient.
    """
    allowed_origins = set(settings.cors_origins)

    async def middleware(request: Request, call_next: Next) -> Response:
        if request.method in SAFE_METHODS or request.headers.get("authorization"):
            return await call_next(request)
        signal = _same_site_signal(request, allowed_origins)
        if request.url.path in SESSION_CREATING_PATHS:
            if signal is False:
                return _forbidden("Requête inter-site refusée.")
            return await call_next(request)
        if read_session_cookie(request, settings) is not None and signal is not True:
            return _forbidden("Requête inter-site refusée.")
        return await call_next(request)

    return middleware

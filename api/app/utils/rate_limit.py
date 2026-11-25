import threading
import time
from collections import deque

from fastapi import HTTPException, Request, status

TOO_MANY_REQUESTS = "Trop de requêtes, réessayez dans une minute."


class SlidingWindowLimiter:
    """In-memory per-key limiter: at most `limit` hits per `window_seconds`; idle keys are dropped."""

    def __init__(self, limit: int, window_seconds: float = 60.0) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()
        self._last_sweep = time.monotonic()

    def _prune(self, key: str, now: float) -> deque[float] | None:
        hits = self._hits.get(key)
        if hits is None:
            return None
        while hits and now - hits[0] > self.window_seconds:
            hits.popleft()
        if not hits:
            del self._hits[key]
            return None
        return hits

    def _sweep(self, now: float) -> None:
        if now - self._last_sweep < self.window_seconds:
            return
        self._last_sweep = now
        for key in list(self._hits):
            self._prune(key, now)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            self._sweep(now)
            hits = self._prune(key, now)
            if hits is None:
                self._hits[key] = deque([now])
                return True
            if len(hits) >= self.limit:
                return False
            hits.append(now)
            return True

    def tracked_keys(self) -> int:
        with self._lock:
            return len(self._hits)

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


def too_many_requests() -> HTTPException:
    return HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=TOO_MANY_REQUESTS)


def client_key(request: Request, trust_proxy_headers: bool) -> str:
    """Identify the caller; X-Forwarded-For is honoured only when the deployment sits behind a trusted proxy."""
    forwarded = request.headers.get("x-forwarded-for") if trust_proxy_headers else None
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce(limiter: SlidingWindowLimiter, request: Request, scope: str, trust_proxy_headers: bool = False) -> None:
    if not limiter.allow(f"{scope}:{client_key(request, trust_proxy_headers)}"):
        raise too_many_requests()

"""Loopback forward proxy that lets Chromium reach public hosts only.

Playwright cannot refuse a redirect before the browser follows it, so the browser is launched with
this proxy and `bypass="<-loopback>"`: every CONNECT (https) and absolute-URI request (http) is
validated with the same rules as the API's SSRF filter, and the upstream connection is opened on
the validated address, which also defeats DNS rebinding between the check and the connection.
"""

import asyncio
import contextlib
import logging
from collections.abc import AsyncIterator
from urllib.parse import urlsplit

from app.utils.url_safety import UnsafeUrl, resolve_public

logger = logging.getLogger("scraper_egress")

MAX_HEADER_BYTES = 64 * 1024
BLOCKED_REPLY = b"HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n"
BAD_REQUEST = b"HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n"
ESTABLISHED = b"HTTP/1.1 200 Connection established\r\n\r\n"
HOP_HEADERS = ("proxy-connection", "proxy-authorization", "connection", "keep-alive")


class EgressProxy:
    def __init__(self) -> None:
        self._server: asyncio.base_events.Server | None = None
        self.port = 0

    @property
    def server_url(self) -> str:
        return f"http://127.0.0.1:{self.port}"

    async def start(self) -> None:
        self._server = await asyncio.start_server(self._handle, "127.0.0.1", 0)
        self.port = self._server.sockets[0].getsockname()[1]

    async def stop(self) -> None:
        if self._server is not None:
            self._server.close()
            await self._server.wait_closed()

    async def _handle(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        try:
            head = await reader.readuntil(b"\r\n\r\n")
        except (asyncio.IncompleteReadError, asyncio.LimitOverrunError, ValueError):
            writer.close()
            return
        try:
            request_line, _, raw_headers = head.partition(b"\r\n")
            method, target, version = request_line.split(b" ", 2)
            if method == b"CONNECT":
                host, _, port = target.decode("ascii").rpartition(":")
                address = await asyncio.to_thread(resolve_public, f"https://{host.strip('[]')}:{port}/")
                upstream = await asyncio.open_connection(*address)
                writer.write(ESTABLISHED)
            else:
                address, origin_form = await asyncio.to_thread(_plain_target, target.decode("ascii"))
                upstream = await asyncio.open_connection(*address)
                upstream[1].write(b" ".join((method, origin_form, version)) + b"\r\n")
                upstream[1].write(_forward_headers(raw_headers) + b"Connection: close\r\n\r\n")
            await upstream[1].drain()
        except UnsafeUrl as error:
            logger.warning("Egress proxy refused %s: %s", target.decode("ascii", "replace"), error)
            writer.write(BLOCKED_REPLY)
            await writer.drain()
            writer.close()
            return
        except (OSError, ValueError) as error:
            logger.warning("Egress proxy could not handle %s: %s", target.decode("ascii", "replace"), error)
            writer.write(BAD_REQUEST)
            await writer.drain()
            writer.close()
            return
        await asyncio.gather(_pipe(reader, upstream[1]), _pipe(upstream[0], writer))


def _plain_target(target: str) -> tuple[tuple[str, int], bytes]:
    parts = urlsplit(target)
    if parts.scheme != "http" or not parts.hostname:
        raise UnsafeUrl("Seules les URL http(s) sont acceptées.")
    address = resolve_public(target)
    path = parts.path or "/"
    if parts.query:
        path += "?" + parts.query
    return address, path.encode("ascii")


def _forward_headers(raw_headers: bytes) -> bytes:
    kept = []
    for line in raw_headers.split(b"\r\n"):
        name = line.split(b":", 1)[0].strip().lower().decode("ascii", "replace")
        if line and name not in HOP_HEADERS:
            kept.append(line)
    return b"\r\n".join(kept) + (b"\r\n" if kept else b"")


async def _pipe(source: asyncio.StreamReader, sink: asyncio.StreamWriter) -> None:
    try:
        while chunk := await source.read(65536):
            sink.write(chunk)
            await sink.drain()
    except (OSError, asyncio.CancelledError):
        pass
    finally:
        with contextlib.suppress(OSError):
            sink.close()


@contextlib.asynccontextmanager
async def egress_proxy() -> AsyncIterator[EgressProxy]:
    proxy = EgressProxy()
    await proxy.start()
    try:
        yield proxy
    finally:
        await proxy.stop()

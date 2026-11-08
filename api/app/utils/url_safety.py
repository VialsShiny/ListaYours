import ipaddress
import socket
from urllib.parse import urlsplit

BLOCKED_HOSTNAMES = {"localhost", "localhost.localdomain", "metadata.google.internal"}


class UnsafeUrl(ValueError):
    pass


def _is_public_address(address: str) -> bool:
    ip = ipaddress.ip_address(address)
    return not (
        not ip.is_global
        or ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
        or (ip.version == 6 and ip.ipv4_mapped is not None and not _is_public_address(str(ip.ipv4_mapped)))
    )


def assert_public_http_url(url: str) -> None:
    """Reject URLs that could reach internal services: non-http schemes, local names, private or reserved addresses."""
    parts = urlsplit(url)
    if parts.scheme not in {"http", "https"}:
        raise UnsafeUrl("Seules les URL http(s) sont acceptées.")
    host = (parts.hostname or "").strip(".").lower()
    if not host or host in BLOCKED_HOSTNAMES or host.endswith((".localhost", ".local", ".internal")):
        raise UnsafeUrl("Cette adresse n'est pas autorisée.")
    try:
        ipaddress.ip_address(host)
        addresses = [host]
    except ValueError:
        try:
            infos = socket.getaddrinfo(
                host, parts.port or (443 if parts.scheme == "https" else 80), proto=socket.IPPROTO_TCP
            )
        except socket.gaierror as error:
            raise UnsafeUrl("Impossible de résoudre ce nom de domaine.") from error
        addresses = [str(info[4][0]) for info in infos]
    if not addresses or not all(_is_public_address(address) for address in addresses):
        raise UnsafeUrl("Cette adresse n'est pas autorisée.")

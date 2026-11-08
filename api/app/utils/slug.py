import re
import unicodedata


def slugify(value: str, fallback: str = "liste") -> str:
    """Turn a title into a URL slug: ASCII letters/digits separated by single hyphens."""
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    return slug[:120] or fallback

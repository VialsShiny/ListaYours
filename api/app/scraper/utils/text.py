import re
from typing import Any, Optional
import logging

logger = logging.getLogger("TEXT DEBUG")

def clean_text(text: Any) -> Optional[str]:
    """Nettoie les espaces blancs et normalise la chaîne de caractères."""
    if text is None:
        return None
    if not isinstance(text, str):
        text = str(text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def is_visible(el) -> bool:
    if el.has_attr("hidden"):
        return False
    if (el.get("aria-hidden") or "").lower() == "true":
        return False
    style = el.get("style", "")
    normalized_style = re.sub(r"\s+", "", style).lower()
    return (
        "display:none" not in normalized_style
        and "visibility:hidden" not in normalized_style
    )


def get_visible_text(soup) -> str:
    """Lower-cased text of the visible nodes; hidden elements are found once instead of per text node."""
    hidden = {id(el) for el in soup.find_all(True) if el.name in ("script", "style", "noscript") or not is_visible(el)}
    texts = []
    for el in soup.find_all(string=True):
        if any(id(parent) in hidden for parent in el.parents if parent.name):
            continue
        texts.append(str(el))
    return clean_text(" ".join(texts)).lower()

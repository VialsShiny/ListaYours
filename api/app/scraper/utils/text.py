import re
from typing import Any, Optional

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
    if el.get("aria-hidden") == "true":
        return False
    style = el.get("style", "")
    if "display:none" in style.replace(" ", "") or "visibility:hidden" in style.replace(" ", ""):
        return False
    return True


def get_visible_text(soup) -> str:
    texts = []
    for el in soup.find_all(string=True):
        parent = el.parent
        if parent.name in ("script", "style", "noscript"):
            continue
        if any(not is_visible(p) for p in parent.parents if p.name):
            continue
        if not is_visible(parent):
            continue
        texts.append(str(el))
    return clean_text(" ".join(texts)).lower()
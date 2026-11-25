"""Low-level CSV reading for the gift import: delimiter detection, header aliases and cell conversions."""

import csv
import io
import re
import unicodedata
from dataclasses import dataclass

from app.schemas.gift_import import MAX_IMPORT_ROWS
from app.services.errors import ServiceError

DELIMITERS = ",;\t"
BOM = "﻿"
HEADER_ALIASES: dict[str, tuple[str, ...]] = {
    "name": ("nom", "name", "titre", "title"),
    "description": ("description", "détails", "details"),
    "price": ("prix", "price"),
    "old_price": ("ancien_prix", "ancien prix", "old_price", "old price"),
    "currency": ("devise", "currency"),
    "purchase_url": ("lien", "url", "purchase_url", "achat"),
    "image_url": ("image", "image_url", "photo"),
    "category": ("catégorie", "categorie", "category"),
    "is_visible": ("visible", "is_visible"),
}
TRUE_VALUES = {"oui", "yes", "true", "1", "vrai"}
FALSE_VALUES = {"non", "no", "false", "0", "faux"}
CURRENCY_SYMBOLS = "€$£"
PRICE_PATTERN = re.compile(r"^-?\d+(\.\d+)?$")

UNREADABLE = "Le fichier CSV est illisible. Vérifiez qu'il s'agit bien d'un fichier CSV."
INVALID_CHARACTERS = "Le fichier contient des caractères invalides."
EMPTY_FILE = "Le fichier est vide."
MISSING_HEADER = "La première ligne du fichier doit contenir les noms des colonnes."
TOO_MANY_ROWS = f"Le fichier contient trop de lignes (maximum {MAX_IMPORT_ROWS} cadeaux)."


@dataclass(frozen=True)
class CsvRow:
    row: int
    values: dict[str, str]


def normalize_header(value: str) -> str:
    """Lower-case, accent-free, with `_`, `-` and repeated spaces folded into single spaces."""
    decomposed = unicodedata.normalize("NFKD", value.strip().casefold())
    plain = "".join(char for char in decomposed if not unicodedata.combining(char))
    return " ".join(plain.replace("_", " ").replace("-", " ").split())


ALIAS_INDEX = {normalize_header(alias): field for field, aliases in HEADER_ALIASES.items() for alias in aliases}


def detect_delimiter(first_line: str) -> str:
    try:
        return csv.Sniffer().sniff(first_line, delimiters=DELIMITERS).delimiter
    except csv.Error:
        return ","


def map_headers(headers: list[str]) -> dict[int, str]:
    """Column index to gift field; unknown columns are ignored and the first column wins on duplicates."""
    mapping: dict[int, str] = {}
    for index, header in enumerate(headers):
        field = ALIAS_INDEX.get(normalize_header(header))
        if field is not None and field not in mapping.values():
            mapping[index] = field
    if "name" not in mapping.values():
        found = ", ".join(f"« {header.strip()} »" for header in headers if header.strip()) or "aucune"
        raise ServiceError(f"Colonne « nom » introuvable. Colonnes trouvées : {found}.", 422)
    return mapping


def _parse(content: str) -> list[list[str]]:
    if "\x00" in content:
        raise ServiceError(INVALID_CHARACTERS, 422)
    if not content.strip():
        raise ServiceError(EMPTY_FILE, 422)
    first_line = content.splitlines()[0]
    if not first_line.strip():
        raise ServiceError(MISSING_HEADER, 422)
    reader = csv.reader(io.StringIO(content, newline=""), delimiter=detect_delimiter(first_line))
    try:
        return list(reader)
    except csv.Error as error:
        raise ServiceError(UNREADABLE, 422) from error


def read_rows(content: str) -> list[CsvRow]:
    """Every non-empty data row, numbered from 1 after the header (blank lines keep their number)."""
    rows = _parse(content.removeprefix(BOM))
    mapping = map_headers(rows[0])
    data: list[CsvRow] = []
    for number, cells in enumerate(rows[1:], start=1):
        if not any(cell.strip() for cell in cells):
            continue
        if len(data) >= MAX_IMPORT_ROWS:
            raise ServiceError(TOO_MANY_ROWS, 422)
        values = {field: cells[index].strip() for index, field in mapping.items() if index < len(cells)}
        data.append(CsvRow(row=number, values=values))
    return data


def parse_price(raw: str) -> str | None:
    """`12,50`, `1 299,00`, `12 €` or `€12` to a plain decimal string; raises ValueError when unreadable."""
    compact = "".join(char for char in raw if not char.isspace() and char not in CURRENCY_SYMBOLS)
    if not compact:
        return None
    if "," in compact and "." in compact:
        decimal_mark = "," if compact.rfind(",") > compact.rfind(".") else "."
        thousands = "." if decimal_mark == "," else ","
        compact = compact.replace(thousands, "").replace(decimal_mark, ".")
    else:
        compact = compact.replace(",", ".")
    if not PRICE_PATTERN.fullmatch(compact):
        raise ValueError(f"« {raw} » n'est pas un prix valide.")
    return compact


def parse_visibility(raw: str) -> bool:
    value = raw.strip().casefold()
    if not value or value in TRUE_VALUES:
        return True
    if value in FALSE_VALUES:
        return False
    raise ValueError(f"« {raw} » n'est pas une visibilité valide (oui ou non).")

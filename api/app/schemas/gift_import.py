"""Request and response bodies of the CSV gift import."""

from pydantic import BaseModel, Field

MAX_IMPORT_CHARS = 1_000_000
MAX_IMPORT_ROWS = 500


class GiftImportRequest(BaseModel):
    """The CSV file decoded as text by the client; the size is checked by the service to answer in French."""

    content: str
    dry_run: bool = False


class GiftImportRowError(BaseModel):
    row: int = Field(description="Numéro de la ligne de données, en-tête exclu, à partir de 1.")
    field: str | None = None
    message: str


class GiftImportResult(BaseModel):
    dry_run: bool
    total_rows: int
    valid_rows: int
    errors: list[GiftImportRowError]
    categories_to_create: list[str]
    created_gifts: int = 0
    created_categories: int = 0

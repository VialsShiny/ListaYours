import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
Slug = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=140)]


class WishlistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str
    description: str
    is_published: bool
    created_at: datetime
    updated_at: datetime


class WishlistUpdate(BaseModel):
    title: Title | None = None
    slug: Slug | None = None
    description: str | None = Field(default=None, max_length=2000)
    is_published: bool | None = None


class WishlistSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    slug: str
    description: str

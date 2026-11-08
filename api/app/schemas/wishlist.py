import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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
    title: str | None = Field(default=None, min_length=1, max_length=120)
    slug: str | None = Field(default=None, min_length=1, max_length=140)
    description: str | None = Field(default=None, max_length=2000)
    is_published: bool | None = None


class WishlistSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    slug: str
    description: str

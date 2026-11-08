import uuid

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    position: int


class ReorderRequest(BaseModel):
    ids: list[uuid.UUID] = Field(min_length=1)

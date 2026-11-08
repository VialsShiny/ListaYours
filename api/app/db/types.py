from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlalchemy.types import TypeDecorator


class UtcDateTime(TypeDecorator[datetime]):
    """Timezone-aware datetime that stays aware on SQLite, which otherwise returns naive values."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect) -> datetime | None:
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value

    def process_result_value(self, value: datetime | None, dialect) -> datetime | None:
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value

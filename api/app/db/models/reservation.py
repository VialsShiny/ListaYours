import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.models.user import utcnow
from app.db.types import UtcDateTime


class Reservation(Base):
    """One row per reserved gift; the UNIQUE constraint on gift_id is what makes double booking impossible."""

    __tablename__ = "reservations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    gift_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("gifts.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    visitor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(UtcDateTime, nullable=False, default=utcnow)

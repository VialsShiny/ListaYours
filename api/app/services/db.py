from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.services.errors import Conflict


def commit_or_conflict(db: Session, message: str) -> None:
    """Commit, turning a unique-constraint race into a 409 with `message` after rolling back."""
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise Conflict(message) from error

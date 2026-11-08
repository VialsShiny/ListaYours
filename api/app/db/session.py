from collections.abc import Iterator

from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.db.base import make_engine

engine = make_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

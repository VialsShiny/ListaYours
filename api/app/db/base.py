from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


def make_engine(database_url: str) -> Engine:
    """Create an engine; SQLite gets thread-safe settings and enforced foreign keys so cascades behave like Postgres."""
    if database_url.startswith("sqlite"):
        kwargs: dict = {"connect_args": {"check_same_thread": False}}
        if ":memory:" in database_url or database_url.endswith("sqlite://"):
            kwargs["poolclass"] = StaticPool
        engine = create_engine(database_url, **kwargs)

        @event.listens_for(engine, "connect")
        def enable_foreign_keys(connection, _record) -> None:
            connection.execute("PRAGMA foreign_keys=ON")

        return engine
    return create_engine(database_url, pool_pre_ping=True)

import os
from pathlib import Path

from sqlalchemy import create_engine, inspect

from alembic import command
from alembic.config import Config
from app.db.base import Base

API_DIR = Path(__file__).resolve().parents[2]


def alembic_config(url: str) -> Config:
    config = Config(str(API_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(API_DIR / "alembic"))
    config.set_main_option("sqlalchemy.url", url)
    return config


def test_upgrade_head_creates_every_model_table(tmp_path) -> None:
    url = os.environ.get("TEST_DATABASE_URL") or f"sqlite:///{tmp_path / 'migrate.db'}"
    engine = create_engine(url)
    config = alembic_config(url)
    Base.metadata.drop_all(bind=engine)
    if url.startswith("postgresql"):
        command.downgrade(config, "base")
    command.upgrade(config, "head")
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names()) - {"alembic_version"}
        assert tables == set(Base.metadata.tables)
        for table in Base.metadata.tables.values():
            columns = {column["name"] for column in inspector.get_columns(table.name)}
            assert columns == {column.name for column in table.columns}, table.name
        for table_name, column_name in (("reservations", "gift_id"), ("users", "email"), ("wishlists", "slug")):
            unique_columns = [list(c["column_names"]) for c in inspector.get_unique_constraints(table_name)]
            unique_columns += [
                [str(c) for c in i["column_names"]] for i in inspector.get_indexes(table_name) if i["unique"]
            ]
            assert [column_name] in unique_columns, (table_name, column_name)
        for table in Base.metadata.tables.values():
            expected_indexes = {tuple(column.name for column in index.columns) for index in table.indexes}
            actual_indexes = {tuple(index["column_names"]) for index in inspector.get_indexes(table.name)}
            assert expected_indexes <= actual_indexes, table.name
    finally:
        command.downgrade(config, "base")
        engine.dispose()

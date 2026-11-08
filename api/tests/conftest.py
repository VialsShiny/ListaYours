import os
import tempfile
from collections.abc import Iterator

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production-0123456789abcdef")
os.environ.setdefault("OWNER_EMAIL", "owner@listayours-test.fr")
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", f"sqlite:///{tempfile.mkdtemp(prefix='listayours-tests-')}/test.db"
)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app import deps
from app.db.base import Base
from app.db.session import engine, get_db
from app.main import app

TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture(autouse=True)
def database() -> Iterator[None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    deps.auth_limiter.reset()
    deps.scrape_limiter.reset()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db() -> Iterator[Session]:
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client() -> Iterator[TestClient]:
    def override_get_db() -> Iterator[Session]:
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def register(client: TestClient, email: str, password: str = "motdepasse123", name: str = "Test") -> dict:
    response = client.post("/api/auth/register", json={"email": email, "password": password, "display_name": name})
    assert response.status_code == 201, response.text
    return response.json()


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def owner(client: TestClient) -> dict:
    return register(client, "owner@listayours-test.fr", name="Thibault")


@pytest.fixture
def visitor(client: TestClient) -> dict:
    return register(client, "visitor@listayours-test.fr", name="Léa")


@pytest.fixture
def visitor2(client: TestClient) -> dict:
    return register(client, "visitor2@listayours-test.fr", name="Lucas")

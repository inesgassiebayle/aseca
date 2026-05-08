import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
from app.services.auth_service import AuthService
from app.db.session import get_db


@pytest.fixture
def client():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app), db
    app.dependency_overrides.clear()

@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def auth_service(db):
    return AuthService(db)
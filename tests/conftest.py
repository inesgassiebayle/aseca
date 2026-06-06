import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
from app.services.auth_service import AuthService
from app.db.session import get_db
from app.services.portfolio_service import PortfolioService


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


@pytest.fixture
def mock_http_client():
    return MagicMock()


@pytest.fixture
def edgar_service(mock_http_client):
    from app.services.edgar_service import EdgarService
    return EdgarService(mock_http_client)


@pytest.fixture
def edgar_client():
    from app.api.v1.endpoints.edgar import get_edgar_service
    mock_service = MagicMock()
    app.dependency_overrides[get_edgar_service] = lambda: mock_service
    yield TestClient(app), mock_service
    app.dependency_overrides.clear()

@pytest.fixture
def portfolio_service(db):
    return PortfolioService(db)
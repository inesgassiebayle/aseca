import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.models import User, WatchlistItem
from app.core.exceptions import TickerAlreadyInWatchlistError
from app.services.watchlist_service import WatchlistService


@pytest.fixture
def client():
    mock_user = User(id=1, email="test@mail.com", hashed_password="hashed")
    db = MagicMock()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield TestClient(app), db
    app.dependency_overrides.clear()


class TestAgregarAWatchlistEndpoint:

    def test_agregar_ticker_retorna_201(self, client):
        test_client, db = client

        def fake_refresh(obj):
            obj.id = 1

        db.query.return_value.filter.return_value.first.return_value = None
        db.refresh.side_effect = fake_refresh

        response = test_client.post("/api/v1/watchlist/", json={"ticker": "AAPL"})
        assert response.status_code == 201

    def test_agregar_ticker_duplicado_retorna_409(self, client, monkeypatch):
        test_client, db = client
        def mock_add(*args, **kwargs):
            raise TickerAlreadyInWatchlistError("AAPL")
        monkeypatch.setattr(WatchlistService, "add", mock_add)
        response = test_client.post("/api/v1/watchlist/", json={"ticker": "AAPL"})
        assert response.status_code == 409

    def test_sin_token_retorna_401(self):
        app.dependency_overrides.clear()
        test_client = TestClient(app)
        response = test_client.post("/api/v1/watchlist/", json={"ticker": "AAPL"})
        assert response.status_code == 401
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from datetime import datetime, timezone

from app.main import app
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.models import User
from app.services.watchlist_service import WatchlistService


@pytest.fixture
def client():
    mock_user = User(id=1, email="test@mail.com", hashed_password="hashed")
    db = MagicMock()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield TestClient(app), db
    app.dependency_overrides.clear()


class TestVerWatchlistEndpoint:

    def test_retorna_200_con_lista(self, client, monkeypatch):
        test_client, db = client
        monkeypatch.setattr(WatchlistService, "get_watchlist", lambda *args, **kwargs: [
            {"id": 1, "ticker": "AAPL", "price": 189.5, "updated_at": datetime.now(timezone.utc)},
        ])
        response = test_client.get("/api/v1/watchlist/")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["ticker"] == "AAPL"

    def test_retorna_200_con_lista_vacia(self, client, monkeypatch):
        test_client, db = client
        monkeypatch.setattr(WatchlistService, "get_watchlist", lambda *args, **kwargs: [])
        response = test_client.get("/api/v1/watchlist/")
        assert response.status_code == 200
        assert response.json() == []

    def test_precio_none_si_no_hay_precio(self, client, monkeypatch):
        test_client, db = client
        monkeypatch.setattr(WatchlistService, "get_watchlist", lambda *args, **kwargs: [
            {"id": 1, "ticker": "AAPL", "price": None, "updated_at": None},
        ])
        response = test_client.get("/api/v1/watchlist/")
        assert response.status_code == 200
        assert response.json()[0]["price"] is None

    def test_sin_token_retorna_401(self):
        app.dependency_overrides.clear()
        test_client = TestClient(app)
        response = test_client.get("/api/v1/watchlist/")
        assert response.status_code == 401
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from app.main import app
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.models import User
from app.core.exceptions import TickerNotInWatchlistError
from app.services.watchlist_service import WatchlistService


@pytest.fixture
def client():
    mock_user = User(id=1, email="test@mail.com", hashed_password="hashed")
    db = MagicMock()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield TestClient(app), db
    app.dependency_overrides.clear()


class TestEliminarDeWatchlistEndpoint:

    def test_eliminar_ticker_existente_retorna_204(self, client, monkeypatch):
        test_client, db = client
        monkeypatch.setattr(WatchlistService, "remove", lambda *args, **kwargs: None)
        response = test_client.delete("/api/v1/watchlist/AAPL")
        assert response.status_code == 204

    def test_eliminar_ticker_no_existente_retorna_404(self, client, monkeypatch):
        test_client, db = client
        def mock_remove(*args, **kwargs):
            raise TickerNotInWatchlistError("AAPL")
        monkeypatch.setattr(WatchlistService, "remove", mock_remove)
        response = test_client.delete("/api/v1/watchlist/AAPL")
        assert response.status_code == 404

    def test_sin_token_retorna_401(self):
        app.dependency_overrides.clear()
        test_client = TestClient(app)
        response = test_client.delete("/api/v1/watchlist/AAPL")
        assert response.status_code == 401
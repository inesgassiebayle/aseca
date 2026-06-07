from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user
from app.main import app
from app.models.models import User, WatchlistItem
from app.core.exceptions import TickerAlreadyInWatchlistError


def make_user():
    return User(id=1, email="usuario@mail.com", hashed_password="hashed")

def make_watchlist_item():
    return WatchlistItem(id=1, user_id=1, ticker="TSLA")


class TestPostWatchlist:
    def test_agregar_ticker_retorna_201(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.watchlist_service import WatchlistService
        with patch.object(WatchlistService, "add", return_value=make_watchlist_item()):
            response = c.post("/api/v1/watchlist/", json={"ticker": "TSLA"})

        assert response.status_code == 201
        app.dependency_overrides.pop(get_current_user, None)

    def test_agregar_ticker_retorna_ticker_en_body(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.watchlist_service import WatchlistService
        with patch.object(WatchlistService, "add", return_value=make_watchlist_item()):
            response = c.post("/api/v1/watchlist/", json={"ticker": "TSLA"})

        assert response.json()["ticker"] == "TSLA"
        app.dependency_overrides.pop(get_current_user, None)

    def test_ticker_duplicado_retorna_409(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.watchlist_service import WatchlistService
        with patch.object(WatchlistService, "add", side_effect=TickerAlreadyInWatchlistError("TSLA ya está en la watchlist")):
            response = c.post("/api/v1/watchlist/", json={"ticker": "TSLA"})

        assert response.status_code == 409
        app.dependency_overrides.pop(get_current_user, None)

    def test_ticker_duplicado_retorna_mensaje_de_error(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.watchlist_service import WatchlistService
        with patch.object(WatchlistService, "add", side_effect=TickerAlreadyInWatchlistError("TSLA ya está en la watchlist")):
            response = c.post("/api/v1/watchlist/", json={"ticker": "TSLA"})

        assert "watchlist" in response.json()["detail"].lower()
        app.dependency_overrides.pop(get_current_user, None)

    def test_sin_autenticacion_retorna_401(self, client):
        c, _ = client
        response = c.post("/api/v1/watchlist/", json={"ticker": "TSLA"})
        assert response.status_code == 401
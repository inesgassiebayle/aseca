from unittest.mock import MagicMock, patch
from app.core.dependencies import get_current_user
from app.main import app
from app.models.models import User, WatchlistItem
from app.core.exceptions import WatchlistItemNotFoundError


def make_user():
    return User(id=1, email="usuario@mail.com", hashed_password="hashed")


class TestDeleteWatchlist:
    def test_eliminar_ticker_retorna_200(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.watchlist_service import WatchlistService
        with patch.object(WatchlistService, "remove", return_value=None):
            response = c.delete("/api/v1/watchlist/TSLA")

        assert response.status_code == 200
        app.dependency_overrides.pop(get_current_user, None)

    def test_eliminar_ticker_retorna_mensaje(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.watchlist_service import WatchlistService
        with patch.object(WatchlistService, "remove", return_value=None):
            response = c.delete("/api/v1/watchlist/TSLA")

        assert "TSLA" in response.json()["message"]
        app.dependency_overrides.pop(get_current_user, None)

    def test_eliminar_ticker_inexistente_retorna_404(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.watchlist_service import WatchlistService
        with patch.object(WatchlistService, "remove", side_effect=WatchlistItemNotFoundError("XYZ no está en tu watchlist")):
            response = c.delete("/api/v1/watchlist/XYZ")

        assert response.status_code == 404
        app.dependency_overrides.pop(get_current_user, None)

    def test_sin_autenticacion_retorna_401(self, client):
        c, _ = client
        response = c.delete("/api/v1/watchlist/TSLA")
        assert response.status_code == 401


class TestGetWhitelist:
    def test_retorna_200(self, client):
        c, _ = client
        response = c.get("/api/v1/watchlist/whitelist")
        assert response.status_code == 200

    def test_retorna_lista_de_tickers(self, client):
        c, _ = client
        response = c.get("/api/v1/watchlist/whitelist")
        body = response.json()
        assert isinstance(body, list)
        assert "AAPL" in body
        assert "TSLA" in body

    def test_no_requiere_autenticacion(self, client):
        c, _ = client
        response = c.get("/api/v1/watchlist/whitelist")
        assert response.status_code == 200
from unittest.mock import patch
from app.core.dependencies import get_current_user
from app.models.models import User
from app.main import app
from datetime import datetime, timezone


def make_user():
    return User(id=1, email="usuario@mail.com", hashed_password="hashed")

def make_detail():
    return {
        "ticker": "AAPL",
        "quantity": 10.0,
        "historical_cost": 1684.2,
        "current_price": 214.30,
        "pnl": 214.3 * 10 - 1684.2,
        "operations": [
            {
                "id": 1,
                "ticker": "AAPL",
                "type": "buy",
                "quantity": 10.0,
                "price": 168.42,
                "executed_at": datetime.now(timezone.utc),
            }
        ],
    }


class TestDetallePosicionAPI:

    def test_detalle_exitoso_retorna_200(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.portfolio_service import PortfolioService
        with patch.object(PortfolioService, "get_position_detail", return_value=make_detail()):
            response = c.get("/api/v1/portfolio/AAPL")

        assert response.status_code == 200
        app.dependency_overrides.pop(get_current_user, None)

    def test_detalle_retorna_datos_correctos(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.portfolio_service import PortfolioService
        with patch.object(PortfolioService, "get_position_detail", return_value=make_detail()):
            response = c.get("/api/v1/portfolio/AAPL")

        body = response.json()
        assert body["ticker"] == "AAPL"
        assert body["quantity"] == 10.0
        assert body["current_price"] == 214.30
        assert len(body["operations"]) == 1
        app.dependency_overrides.pop(get_current_user, None)

    def test_detalle_posicion_inexistente_retorna_404(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.core.exceptions import PositionNotFoundError
        from app.services.portfolio_service import PortfolioService
        with patch.object(PortfolioService, "get_position_detail", side_effect=PositionNotFoundError("No tenés posición en TSLA")):
            response = c.get("/api/v1/portfolio/TSLA")

        assert response.status_code == 404
        app.dependency_overrides.pop(get_current_user, None)

    def test_detalle_sin_autenticacion_retorna_401(self, client):
        c, _ = client
        response = c.get("/api/v1/portfolio/AAPL")
        assert response.status_code == 401
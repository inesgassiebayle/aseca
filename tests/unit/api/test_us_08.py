from unittest.mock import MagicMock, patch
from app.core.dependencies import get_current_user
from app.models.models import User, Operation
from app.main import app
from datetime import datetime, timezone


def make_user():
    return User(id=1, email="usuario@mail.com", hashed_password="hashed")

def make_operation():
    return Operation(
        id=1,
        ticker="AAPL",
        type="buy",
        quantity=10,
        price=214.30,
        executed_at=datetime.now(timezone.utc),
    )


class TestCompraAPI:

    def test_compra_exitosa_retorna_201(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.portfolio_service import PortfolioService
        with patch.object(PortfolioService, "buy", return_value=make_operation()):
            response = c.post("/api/v1/portfolio/buy", json={
                "ticker": "AAPL",
                "quantity": 10,
            })

        assert response.status_code == 201
        app.dependency_overrides.pop(get_current_user, None)

    def test_compra_exitosa_retorna_operacion(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.portfolio_service import PortfolioService
        with patch.object(PortfolioService, "buy", return_value=make_operation()):
            response = c.post("/api/v1/portfolio/buy", json={
                "ticker": "AAPL",
                "quantity": 10,
            })

        body = response.json()
        assert body["ticker"] == "AAPL"
        assert body["type"] == "buy"
        assert body["quantity"] == 10
        app.dependency_overrides.pop(get_current_user, None)

    def test_compra_ticker_sin_precio_retorna_422(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.core.exceptions import TickerNotFoundError
        from app.services.portfolio_service import PortfolioService
        with patch.object(PortfolioService, "buy", side_effect=TickerNotFoundError("No hay precio")):
            response = c.post("/api/v1/portfolio/buy", json={
                "ticker": "XYZ",
                "quantity": 10,
            })

        assert response.status_code == 422
        assert "precio" in response.json()["detail"].lower()
        app.dependency_overrides.pop(get_current_user, None)

    def test_compra_sin_autenticacion_retorna_401(self, client):
        c, _ = client
        response = c.post("/api/v1/portfolio/buy", json={
            "ticker": "AAPL",
            "quantity": 10,
        })
        assert response.status_code == 401
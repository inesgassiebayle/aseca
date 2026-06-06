from unittest.mock import patch
from app.core.dependencies import get_current_user
from app.models.models import User, Operation
from app.main import app
from datetime import datetime, timezone


def make_user():
    return User(id=1, email="usuario@mail.com", hashed_password="hashed")

def make_operation():
    return Operation(
        id=2,
        ticker="AAPL",
        type="sell",
        quantity=10,
        price=214.30,
        executed_at=datetime.now(timezone.utc),
    )


class TestVentaAPI:

    def test_venta_exitosa_retorna_201(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.portfolio_service import PortfolioService
        with patch.object(PortfolioService, "sell", return_value=make_operation()):
            response = c.post("/api/v1/portfolio/sell", json={
                "ticker": "AAPL",
                "quantity": 10,
            })

        assert response.status_code == 201
        app.dependency_overrides.pop(get_current_user, None)

    def test_venta_exitosa_retorna_operacion(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.services.portfolio_service import PortfolioService
        with patch.object(PortfolioService, "sell", return_value=make_operation()):
            response = c.post("/api/v1/portfolio/sell", json={
                "ticker": "AAPL",
                "quantity": 10,
            })

        body = response.json()
        assert body["ticker"] == "AAPL"
        assert body["type"] == "sell"
        assert body["quantity"] == 10
        app.dependency_overrides.pop(get_current_user, None)

    def test_venta_sin_posicion_retorna_422(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        from app.core.exceptions import InsufficientSharesError
        from app.services.portfolio_service import PortfolioService
        with patch.object(PortfolioService, "sell", side_effect=InsufficientSharesError("No tenés posición")):
            response = c.post("/api/v1/portfolio/sell", json={
                "ticker": "TSLA",
                "quantity": 5,
            })

        assert response.status_code == 422
        app.dependency_overrides.pop(get_current_user, None)

    def test_venta_sin_autenticacion_retorna_401(self, client):
        c, _ = client
        response = c.post("/api/v1/portfolio/sell", json={
            "ticker": "AAPL",
            "quantity": 10,
        })
        assert response.status_code == 401
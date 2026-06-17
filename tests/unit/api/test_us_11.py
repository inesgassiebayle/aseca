from unittest.mock import patch, MagicMock
from app.core.dependencies import get_current_user
from app.models.models import User, Position, StockPrice
from app.main import app
from datetime import datetime, timezone


def make_user():
    return User(id=1, email="usuario@mail.com", hashed_password="hashed")


class TestVerPortfolioAPI:

    def test_portfolio_retorna_200(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user
        db.query.return_value.filter.return_value.all.return_value = []

        response = c.get("/api/v1/portfolio/")

        assert response.status_code == 200
        app.dependency_overrides.pop(get_current_user, None)

    def test_portfolio_vacio_retorna_lista_vacia(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user
        db.query.return_value.filter.return_value.all.return_value = []

        response = c.get("/api/v1/portfolio/")
        assert response.json() == []
        app.dependency_overrides.pop(get_current_user, None)

    def test_portfolio_con_posiciones_retorna_datos(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        position = Position(id=1, user_id=1, ticker="AAPL", quantity=10, historical_cost=1684.2)
        price = StockPrice(ticker="AAPL", price=214.30, updated_at=datetime.now(timezone.utc))

        db.query.return_value.filter.return_value.all.return_value = [position]
        db.query.return_value.filter.return_value.first.return_value = price

        response = c.get("/api/v1/portfolio/")
        body = response.json()

        assert len(body) == 1
        assert body[0]["ticker"] == "AAPL"
        assert body[0]["quantity"] == 10
        assert body[0]["current_price"] == 214.30
        assert body[0]["current_value"] == 2143.0
        app.dependency_overrides.pop(get_current_user, None)

    def test_portfolio_sin_precio_muestra_none(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user

        position = Position(id=1, user_id=1, ticker="XYZ", quantity=5, historical_cost=500.0)

        db.query.return_value.filter.return_value.all.return_value = [position]
        db.query.return_value.filter.return_value.first.return_value = None

        response = c.get("/api/v1/portfolio/")
        body = response.json()

        assert body[0]["current_price"] is None
        assert body[0]["current_value"] is None
        app.dependency_overrides.pop(get_current_user, None)

    def test_portfolio_sin_autenticacion_retorna_401(self, client):
        c, _ = client
        response = c.get("/api/v1/portfolio/")
        assert response.status_code == 401
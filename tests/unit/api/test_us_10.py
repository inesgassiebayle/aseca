from unittest.mock import patch
from app.core.dependencies import get_current_user
from app.models.models import User, Operation
from app.main import app
from datetime import datetime, timezone


def make_user():
    return User(id=1, email="usuario@mail.com", hashed_password="hashed")

def make_operations():
    return [
        Operation(id=1, ticker="AAPL", type="buy", quantity=10, price=214.30, executed_at=datetime(2026, 5, 10, tzinfo=timezone.utc)),
        Operation(id=2, ticker="MSFT", type="buy", quantity=5, price=428.55, executed_at=datetime(2026, 5, 8, tzinfo=timezone.utc)),
        Operation(id=3, ticker="AAPL", type="sell", quantity=3, price=220.00, executed_at=datetime(2026, 5, 6, tzinfo=timezone.utc)),
    ]


class TestHistorialAPI:

    def test_historial_retorna_200(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user
        db.query.return_value.filter.return_value.order_by.return_value.all.return_value = make_operations()

        response = c.get("/api/v1/operations/")

        assert response.status_code == 200
        app.dependency_overrides.pop(get_current_user, None)

    def test_historial_retorna_operaciones(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user
        db.query.return_value.filter.return_value.order_by.return_value.all.return_value = make_operations()

        response = c.get("/api/v1/operations/")
        body = response.json()

        assert len(body) == 3
        assert body[0]["ticker"] == "AAPL"
        assert body[0]["type"] == "buy"
        app.dependency_overrides.pop(get_current_user, None)

    def test_historial_filtrado_por_ticker(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user
        aapl_ops = [o for o in make_operations() if o.ticker == "AAPL"]
        db.query.return_value.filter.return_value.filter.return_value.order_by.return_value.all.return_value = aapl_ops

        response = c.get("/api/v1/operations/?ticker=AAPL")
        body = response.json()

        assert all(op["ticker"] == "AAPL" for op in body)
        app.dependency_overrides.pop(get_current_user, None)

    def test_historial_vacio(self, client):
        c, db = client
        app.dependency_overrides[get_current_user] = make_user
        db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []

        response = c.get("/api/v1/operations/")
        body = response.json()

        assert body == []
        app.dependency_overrides.pop(get_current_user, None)

    def test_historial_sin_autenticacion_retorna_401(self, client):
        c, _ = client
        response = c.get("/api/v1/operations/")
        assert response.status_code == 401
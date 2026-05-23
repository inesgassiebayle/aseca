import pytest
from datetime import datetime, timezone

from app.models.models import Position, StockPrice


class TestVerPortfolioService:

    def test_portfolio_vacio(self, portfolio_service, db):
        db.query.return_value.filter.return_value.all.return_value = []

        result = portfolio_service.get_portfolio(user_id=1)

        assert result == []

    def test_portfolio_con_precio(self, portfolio_service, db):
        position = Position(id=1, user_id=1, ticker="AAPL", quantity=10, avg_price=168.42)
        price = StockPrice(ticker="AAPL", price=214.30, updated_at=datetime.now(timezone.utc))

        db.query.return_value.filter.return_value.all.return_value = [position]
        db.query.return_value.filter.return_value.first.return_value = price

        result = portfolio_service.get_portfolio(user_id=1)

        assert len(result) == 1
        assert result[0]["ticker"] == "AAPL"
        assert result[0]["current_price"] == 214.30
        assert result[0]["current_value"] == 2143.0

    def test_portfolio_sin_precio_almacenado(self, portfolio_service, db):
        position = Position(id=1, user_id=1, ticker="XYZ", quantity=5, avg_price=100.0)

        db.query.return_value.filter.return_value.all.return_value = [position]
        db.query.return_value.filter.return_value.first.return_value = None

        result = portfolio_service.get_portfolio(user_id=1)

        assert result[0]["current_price"] is None
        assert result[0]["current_value"] is None
import pytest
from datetime import datetime, timezone

from app.core.exceptions import PositionNotFoundError
from app.models.models import Position, StockPrice, Operation


class TestDetallePosicionService:

    def test_detalle_exitoso(self, portfolio_service, db):
        position = Position(id=1, user_id=1, ticker="AAPL", quantity=10, avg_price=168.42)
        price = StockPrice(ticker="AAPL", price=214.30, updated_at=datetime.now(timezone.utc))
        ops = [
            Operation(id=1, user_id=1, ticker="AAPL", type="buy", quantity=10, price=168.42, executed_at=datetime.now(timezone.utc))
        ]
        db.query.return_value.filter.return_value.first.side_effect = [position, price]
        db.query.return_value.filter.return_value.order_by.return_value.all.return_value = ops

        result = portfolio_service.get_position_detail(user_id=1, ticker="AAPL")

        assert result["ticker"] == "AAPL"
        assert result["quantity"] == 10
        assert result["current_price"] == 214.30
        assert result["pnl"] == (214.30 - 168.42) * 10
        assert len(result["operations"]) == 1

    def test_detalle_sin_precio(self, portfolio_service, db):
        position = Position(id=1, user_id=1, ticker="AAPL", quantity=10, avg_price=168.42)
        db.query.return_value.filter.return_value.first.side_effect = [position, None]
        db.query.return_value.filter.return_value.filter.return_value.order_by.return_value.all.return_value = []

        result = portfolio_service.get_position_detail(user_id=1, ticker="AAPL")

        assert result["current_price"] is None
        assert result["pnl"] is None

    def test_detalle_posicion_inexistente(self, portfolio_service, db):
        db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(PositionNotFoundError):
            portfolio_service.get_position_detail(user_id=1, ticker="TSLA")
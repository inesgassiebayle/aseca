import pytest
from datetime import datetime, timezone

from app.core.exceptions import TickerNotFoundError, InsufficientSharesError
from app.models.models import StockPrice, Position


class TestVenderAcciones:

    def test_venta_exitosa_parcial(self, portfolio_service, db):
        price = StockPrice(ticker="AAPL", price=214.30, updated_at=datetime.now(timezone.utc))
        position = Position(user_id=1, ticker="AAPL", quantity=20, avg_price=168.42)
        db.query.return_value.filter.return_value.first.side_effect = [price, position]

        portfolio_service.sell(user_id=1, ticker="AAPL", quantity=10)

        assert position.quantity == 10
        db.commit.assert_called_once()

    def test_venta_cierra_posicion(self, portfolio_service, db):
        price = StockPrice(ticker="AAPL", price=214.30, updated_at=datetime.now(timezone.utc))
        position = Position(user_id=1, ticker="AAPL", quantity=10, avg_price=168.42)
        db.query.return_value.filter.return_value.first.side_effect = [price, position]

        portfolio_service.sell(user_id=1, ticker="AAPL", quantity=10)

        db.delete.assert_called_once_with(position)
        db.commit.assert_called_once()

    def test_venta_cantidad_mayor_disponible_lanza_excepcion(self, portfolio_service, db):
        price = StockPrice(ticker="AAPL", price=214.30, updated_at=datetime.now(timezone.utc))
        position = Position(user_id=1, ticker="AAPL", quantity=5, avg_price=168.42)
        db.query.return_value.filter.return_value.first.side_effect = [price, position]

        with pytest.raises(InsufficientSharesError):
            portfolio_service.sell(user_id=1, ticker="AAPL", quantity=10)

    def test_venta_ticker_no_poseido_lanza_excepcion(self, portfolio_service, db):
        price = StockPrice(ticker="TSLA", price=218.40, updated_at=datetime.now(timezone.utc))
        db.query.return_value.filter.return_value.first.side_effect = [price, None]

        with pytest.raises(InsufficientSharesError):
            portfolio_service.sell(user_id=1, ticker="TSLA", quantity=5)

    def test_venta_sin_precio_almacenado_lanza_excepcion(self, portfolio_service, db):
        db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(TickerNotFoundError):
            portfolio_service.sell(user_id=1, ticker="XYZ", quantity=5)
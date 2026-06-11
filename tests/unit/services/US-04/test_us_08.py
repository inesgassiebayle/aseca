import pytest
from datetime import datetime, timezone

from app.core.exceptions import TickerNotFoundError
from app.models.models import StockPrice, Position


class TestComprarAcciones:
    def test_compra_exitosa_crea_posicion_nueva(self, portfolio_service, db):
        price = StockPrice(ticker="AAPL", price=150.0, updated_at=datetime.now(timezone.utc))
        db.query.return_value.filter.return_value.first.side_effect = [price, None]

        portfolio_service.buy(user_id=1, ticker="AAPL", quantity=10)

        db.add.assert_called()
        db.commit.assert_called_once()

    def test_compra_exitosa_actualiza_posicion_existente(self, portfolio_service, db):
        price = StockPrice(ticker="AAPL", price=150.0, updated_at=datetime.now(timezone.utc))
        position = Position(user_id=1, ticker="AAPL", quantity=5, historical_cost=700.0)
        db.query.return_value.filter.return_value.first.side_effect = [price, position]

        portfolio_service.buy(user_id=1, ticker="AAPL", quantity=10)

        assert position.quantity == 15
        assert position.historical_cost == 2200.0
        db.commit.assert_called_once()

    def test_compra_sin_precio_almacenado_lanza_excepcion(self, portfolio_service, db):
        db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(TickerNotFoundError):
            portfolio_service.buy(user_id=1, ticker="XYZ", quantity=10)
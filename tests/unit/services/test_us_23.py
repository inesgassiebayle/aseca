import pytest
from unittest.mock import MagicMock
from datetime import datetime
from app.services.watchlist_service import WatchlistService
from app.models.models import WatchlistItem, StockPrice


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def service(db):
    return WatchlistService(db)


class TestGetWatchlistConPrecios:

    def test_retorna_lista_vacia(self, service, db):
        db.query.return_value.filter.return_value.all.return_value = []
        result = service.get_with_prices(user_id=1)
        assert result == []

    def test_retorna_ticker_con_precio(self, service, db):
        now = datetime(2025, 1, 1, 12, 0, 0)
        db.query.return_value.outerjoin.return_value.filter.return_value.all.return_value = [
            (WatchlistItem(id=1, user_id=1, ticker="AAPL"), StockPrice(ticker="AAPL", price=189.5, updated_at=now))
        ]
        result = service.get_with_prices(user_id=1)
        assert len(result) == 1
        assert result[0]["ticker"] == "AAPL"
        assert result[0]["price"] == 189.5
        assert result[0]["updated_at"] == now

    def test_retorna_ticker_sin_precio(self, service, db):
        db.query.return_value.outerjoin.return_value.filter.return_value.all.return_value = [
            (WatchlistItem(id=2, user_id=1, ticker="XYZ"), None)
        ]
        result = service.get_with_prices(user_id=1)
        assert result[0]["ticker"] == "XYZ"
        assert result[0]["price"] is None
        assert result[0]["updated_at"] is None

    def test_retorna_multiples_tickers_mixtos(self, service, db):
        now = datetime(2025, 1, 1, 12, 0, 0)
        db.query.return_value.outerjoin.return_value.filter.return_value.all.return_value = [
            (WatchlistItem(id=1, user_id=1, ticker="AAPL"), StockPrice(ticker="AAPL", price=189.5, updated_at=now)),
            (WatchlistItem(id=2, user_id=1, ticker="XYZ"), None),
        ]
        result = service.get_with_prices(user_id=1)
        assert len(result) == 2
        assert result[1]["price"] is None

    def test_estructura_del_resultado(self, service, db):
        now = datetime(2025, 1, 1, 12, 0, 0)
        db.query.return_value.outerjoin.return_value.filter.return_value.all.return_value = [
            (WatchlistItem(id=1, user_id=1, ticker="TSLA"), StockPrice(ticker="TSLA", price=250.0, updated_at=now))
        ]
        result = service.get_with_prices(user_id=1)
        item = result[0]
        assert "id" in item
        assert "ticker" in item
        assert "price" in item
        assert "updated_at" in item
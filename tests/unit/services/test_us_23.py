import pytest
from unittest.mock import MagicMock
from app.services.watchlist_service import WatchlistService
from app.models.models import WatchlistItem, StockPrice
from datetime import datetime, timezone


@pytest.fixture
def db():
    return MagicMock()

@pytest.fixture
def watchlist_service(db):
    return WatchlistService(db)


class TestVerWatchlist:

    def test_retorna_lista_de_tickers(self, watchlist_service, db):
        db.query.return_value.filter.return_value.all.return_value = [
            WatchlistItem(id=1, user_id=1, ticker="AAPL"),
            WatchlistItem(id=2, user_id=1, ticker="MSFT"),
        ]
        db.query.return_value.filter.return_value.first.return_value = None
        result = watchlist_service.get_watchlist(user_id=1)
        assert len(result) == 2

    def test_incluye_precio_si_existe(self, watchlist_service, db):
        db.query.return_value.filter.return_value.all.return_value = [
            WatchlistItem(id=1, user_id=1, ticker="AAPL"),
        ]
        db.query.return_value.filter.return_value.first.return_value = StockPrice(
            ticker="AAPL", price=189.5, updated_at=datetime.now(timezone.utc)
        )
        result = watchlist_service.get_watchlist(user_id=1)
        assert result[0]["price"] == 189.5

    def test_precio_es_none_si_no_existe(self, watchlist_service, db):
        db.query.return_value.filter.return_value.all.return_value = [
            WatchlistItem(id=1, user_id=1, ticker="AAPL"),
        ]
        db.query.return_value.filter.return_value.first.return_value = None
        result = watchlist_service.get_watchlist(user_id=1)
        assert result[0]["price"] is None

    def test_retorna_lista_vacia_si_no_hay_items(self, watchlist_service, db):
        db.query.return_value.filter.return_value.all.return_value = []
        result = watchlist_service.get_watchlist(user_id=1)
        assert result == []
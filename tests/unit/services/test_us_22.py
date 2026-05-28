import pytest
from unittest.mock import MagicMock
from app.services.watchlist_service import WatchlistService
from app.models.models import WatchlistItem
from app.core.exceptions import TickerNotInWatchlistError


@pytest.fixture
def db():
    return MagicMock()

@pytest.fixture
def watchlist_service(db):
    return WatchlistService(db)


class TestEliminarDeWatchlist:

    def test_eliminar_ticker_existente_llama_delete(self, watchlist_service, db):
        item = WatchlistItem(id=1, user_id=1, ticker="AAPL")
        db.query.return_value.filter.return_value.first.return_value = item
        watchlist_service.remove(user_id=1, ticker="AAPL")
        db.delete.assert_called_once_with(item)
        db.commit.assert_called_once()

    def test_eliminar_ticker_no_existente_lanza_excepcion(self, watchlist_service, db):
        db.query.return_value.filter.return_value.first.return_value = None
        with pytest.raises(TickerNotInWatchlistError):
            watchlist_service.remove(user_id=1, ticker="AAPL")

    def test_eliminar_convierte_ticker_a_mayusculas(self, watchlist_service, db):
        item = WatchlistItem(id=1, user_id=1, ticker="AAPL")
        db.query.return_value.filter.return_value.first.return_value = item
        watchlist_service.remove(user_id=1, ticker="aapl")
        db.delete.assert_called_once_with(item)
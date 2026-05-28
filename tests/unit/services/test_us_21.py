import pytest
from unittest.mock import MagicMock
from app.services.watchlist_service import WatchlistService
from app.models.models import WatchlistItem
from app.core.exceptions import TickerAlreadyInWatchlistError


@pytest.fixture
def db():
    return MagicMock()

@pytest.fixture
def watchlist_service(db):
    return WatchlistService(db)


class TestAgregarAWatchlist:

    def test_agregar_ticker_nuevo_retorna_item(self, watchlist_service, db):
        db.query.return_value.filter.return_value.first.return_value = None
        result = watchlist_service.add(user_id=1, ticker="AAPL")
        assert result.ticker == "AAPL"

    def test_agregar_ticker_lo_guarda_en_db(self, watchlist_service, db):
        db.query.return_value.filter.return_value.first.return_value = None
        watchlist_service.add(user_id=1, ticker="AAPL")
        db.add.assert_called_once()
        db.commit.assert_called_once()

    def test_agregar_ticker_lo_convierte_a_mayusculas(self, watchlist_service, db):
        db.query.return_value.filter.return_value.first.return_value = None
        watchlist_service.add(user_id=1, ticker="aapl")
        item_guardado = db.add.call_args[0][0]
        assert item_guardado.ticker == "AAPL"

    def test_agregar_ticker_duplicado_lanza_excepcion(self, watchlist_service, db):
        db.query.return_value.filter.return_value.first.return_value = WatchlistItem(
            user_id=1, ticker="AAPL"
        )
        with pytest.raises(TickerAlreadyInWatchlistError):
            watchlist_service.add(user_id=1, ticker="AAPL")
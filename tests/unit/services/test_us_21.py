import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy.orm import Session

from app.models.models import WatchlistItem
from app.services.watchlist_service import WatchlistService
from app.core.exceptions import TickerAlreadyInWatchlistError


@pytest.fixture
def db():
    return MagicMock(spec=Session)


@pytest.fixture
def service(db):
    return WatchlistService(db)


class TestAgregarAWatchlist:
    def test_agrega_ticker_nuevo(self, service, db):
        db.query.return_value.filter.return_value.first.return_value = None

        result = service.add(user_id=1, ticker="TSLA")

        db.add.assert_called_once()
        db.commit.assert_called_once()
        assert result.ticker == "TSLA"
        assert result.user_id == 1

    def test_ticker_se_guarda_en_mayusculas(self, service, db):
        db.query.return_value.filter.return_value.first.return_value = None

        result = service.add(user_id=1, ticker="tsla")

        assert result.ticker == "TSLA"

    def test_ticker_duplicado_lanza_error(self, service, db):
        db.query.return_value.filter.return_value.first.return_value = WatchlistItem(
            id=1, user_id=1, ticker="TSLA"
        )

        with pytest.raises(TickerAlreadyInWatchlistError):
            service.add(user_id=1, ticker="TSLA")

    def test_ticker_duplicado_no_hace_commit(self, service, db):
        db.query.return_value.filter.return_value.first.return_value = WatchlistItem(
            id=1, user_id=1, ticker="TSLA"
        )

        with pytest.raises(TickerAlreadyInWatchlistError):
            service.add(user_id=1, ticker="TSLA")

        db.commit.assert_not_called()

    def test_usuarios_distintos_pueden_tener_mismo_ticker(self, service, db):
        db.query.return_value.filter.return_value.first.return_value = None

        result = service.add(user_id=2, ticker="TSLA")

        db.add.assert_called_once()
        assert result.user_id == 2
from datetime import datetime
from unittest.mock import MagicMock, call

import pytest

from app.models.models import BatchRun, StockPrice
from app.services.price_service import BatchResult, PriceService

WHITELIST = ["AAPL", "MSFT", "GOOGL"]


@pytest.fixture
def mock_yahoo():
    return MagicMock()


@pytest.fixture
def price_service(db, mock_yahoo):
    return PriceService(db, mock_yahoo, WHITELIST)


class TestBatchActualizacionExitosa:
    def test_actualiza_todos_los_tickers(self, price_service, mock_yahoo, db):
        mock_yahoo.get_price.side_effect = lambda t: {"AAPL": 150.0, "MSFT": 300.0, "GOOGL": 140.0}[t]
        db.query.return_value.filter.return_value.first.return_value = None

        result = price_service.run_batch()

        assert result.updated == 3
        assert result.failed == 0

    def test_reporte_retorna_batch_result(self, price_service, mock_yahoo, db):
        mock_yahoo.get_price.return_value = 100.0
        db.query.return_value.filter.return_value.first.return_value = None

        result = price_service.run_batch()

        assert isinstance(result, BatchResult)

    def test_persiste_precio_por_ticker(self, price_service, mock_yahoo, db):
        mock_yahoo.get_price.return_value = 150.0
        db.query.return_value.filter.return_value.first.return_value = None

        price_service.run_batch()

        added_objects = [c[0][0] for c in db.add.call_args_list]
        stock_prices = [o for o in added_objects if isinstance(o, StockPrice)]
        assert len(stock_prices) == 3
        for sp in stock_prices:
            assert sp.price == 150.0

    def test_guarda_batch_run_global(self, price_service, mock_yahoo, db):
        mock_yahoo.get_price.return_value = 100.0
        db.query.return_value.filter.return_value.first.return_value = None

        price_service.run_batch()

        added_objects = [c[0][0] for c in db.add.call_args_list]
        batch_runs = [o for o in added_objects if isinstance(o, BatchRun)]
        assert len(batch_runs) == 1

    def test_hace_commit(self, price_service, mock_yahoo, db):
        mock_yahoo.get_price.return_value = 100.0
        db.query.return_value.filter.return_value.first.return_value = None

        price_service.run_batch()

        db.commit.assert_called_once()

    def test_resultado_contiene_ran_at(self, price_service, mock_yahoo, db):
        mock_yahoo.get_price.return_value = 100.0
        db.query.return_value.filter.return_value.first.return_value = None

        result = price_service.run_batch()

        assert result.ran_at is not None
        assert isinstance(result.ran_at, datetime)

    def test_ticker_existente_se_actualiza_en_lugar_de_crear(self, price_service, mock_yahoo, db):
        existing = StockPrice(ticker="AAPL", price=100.0)
        mock_yahoo.get_price.return_value = 200.0
        db.query.return_value.filter.return_value.first.return_value = existing

        price_service.run_batch()

        assert existing.price == 200.0

    def test_ticker_existente_no_llama_add(self, price_service, mock_yahoo, db):
        existing = StockPrice(ticker="AAPL", price=100.0)
        mock_yahoo.get_price.return_value = 200.0
        db.query.return_value.filter.return_value.first.return_value = existing

        price_service.run_batch()

        added_objects = [c[0][0] for c in db.add.call_args_list]
        stock_prices = [o for o in added_objects if isinstance(o, StockPrice)]
        assert len(stock_prices) == 0


class TestBatchConFallos:
    def test_ticker_fallido_no_interrumpe_el_proceso(self, price_service, mock_yahoo, db):
        def get_price(t):
            return None if t == "MSFT" else 100.0

        mock_yahoo.get_price.side_effect = get_price
        db.query.return_value.filter.return_value.first.return_value = None

        result = price_service.run_batch()

        assert result.updated == 2
        assert result.failed == 1

    def test_todos_los_tickers_fallan(self, price_service, mock_yahoo, db):
        mock_yahoo.get_price.return_value = None
        db.query.return_value.filter.return_value.first.return_value = None

        result = price_service.run_batch()

        assert result.updated == 0
        assert result.failed == 3

    def test_batch_run_se_guarda_aunque_haya_fallos(self, price_service, mock_yahoo, db):
        mock_yahoo.get_price.return_value = None
        db.query.return_value.filter.return_value.first.return_value = None

        price_service.run_batch()

        added_objects = [c[0][0] for c in db.add.call_args_list]
        batch_runs = [o for o in added_objects if isinstance(o, BatchRun)]
        assert len(batch_runs) == 1

    def test_batch_run_registra_conteos_correctos(self, price_service, mock_yahoo, db):
        def get_price(t):
            return None if t == "MSFT" else 100.0

        mock_yahoo.get_price.side_effect = get_price
        db.query.return_value.filter.return_value.first.return_value = None

        price_service.run_batch()

        added_objects = [c[0][0] for c in db.add.call_args_list]
        batch_run = next(o for o in added_objects if isinstance(o, BatchRun))
        assert batch_run.updated_count == 2
        assert batch_run.failed_count == 1


class TestUltimaActualizacion:
    def test_retorna_none_si_no_hay_batch(self, price_service, db):
        db.query.return_value.order_by.return_value.first.return_value = None

        result = price_service.get_last_update()

        assert result is None

    def test_retorna_fecha_del_ultimo_batch(self, price_service, db):
        ran_at = datetime(2024, 6, 1, 12, 0, 0)
        db.query.return_value.order_by.return_value.first.return_value = BatchRun(
            ran_at=ran_at, updated_count=3, failed_count=0
        )

        result = price_service.get_last_update()

        assert result == ran_at


class TestGetPrice:
    def test_retorna_precio_si_existe(self, price_service, db):
        db.query.return_value.filter.return_value.first.return_value = StockPrice(
            ticker="AAPL", price=175.0
        )

        result = price_service.get_price("AAPL")

        assert result == 175.0

    def test_retorna_none_si_no_existe(self, price_service, db):
        db.query.return_value.filter.return_value.first.return_value = None

        result = price_service.get_price("AAPL")

        assert result is None

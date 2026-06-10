import pytest
from unittest.mock import MagicMock, patch
from app.services.watchlist_compare_service import WatchlistCompareService
from app.integrations.edgar import CompanyFinancials, FinancialMetric


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def service(db):
    return WatchlistCompareService(db)


def make_financials(ticker: str) -> CompanyFinancials:
    return CompanyFinancials(
        cik="0001234567",
        ticker=ticker,
        from_cache=False,
        revenue=FinancialMetric(concept="Revenues", value=100_000_000.0, unit="USD", period="2024-09-30"),
        net_income=FinancialMetric(concept="NetIncomeLoss", value=20_000_000.0, unit="USD", period="2024-09-30"),
        eps=FinancialMetric(concept="EarningsPerShareBasic", value=1.5, unit="USD/shares", period="2024-09-30"),
        total_assets=FinancialMetric(concept="Assets", value=500_000_000.0, unit="USD", period="2024-09-30"),
        total_liabilities=FinancialMetric(concept="Liabilities", value=200_000_000.0, unit="USD", period="2024-09-30"),
    )


class TestUS24CompararMetricas:

    def test_ticker_no_en_watchlist_lanza_error(self, service, db):
        from app.core.exceptions import WatchlistItemNotFoundError
        db.query.return_value.filter.return_value.first.return_value = None
        with pytest.raises(WatchlistItemNotFoundError):
            service.compare_metrics(user_id=1, tickers=["TSLA"])

    def test_retorna_metricas_para_ticker_con_datos(self, service, db):
        from app.models.models import WatchlistItem
        db.query.return_value.filter.return_value.first.return_value = WatchlistItem(id=1, user_id=1, ticker="AAPL")
        with patch.object(service.xbrl_client, "get_company_financials", return_value=make_financials("AAPL")):
            with patch.object(service, "_get_cik", return_value="0001234567"):
                result = service.compare_metrics(user_id=1, tickers=["AAPL"])
        assert result[0]["ticker"] == "AAPL"
        assert result[0]["revenue"] == 100_000_000.0
        assert result[0]["net_income"] == 20_000_000.0
        assert result[0]["eps"] == 1.5
        assert result[0]["total_assets"] == 500_000_000.0
        assert result[0]["total_liabilities"] == 200_000_000.0

    def test_ticker_sin_datos_edgar_devuelve_none_en_metricas(self, service, db):
        from app.models.models import WatchlistItem
        db.query.return_value.filter.return_value.first.return_value = WatchlistItem(id=1, user_id=1, ticker="XYZ")
        with patch.object(service.xbrl_client, "get_company_financials", return_value=None):
            with patch.object(service, "_get_cik", return_value="0000000001"):
                result = service.compare_metrics(user_id=1, tickers=["XYZ"])
        assert result[0]["ticker"] == "XYZ"
        assert result[0]["revenue"] is None
        assert result[0]["net_income"] is None

    def test_multiples_tickers(self, service, db):
        from app.models.models import WatchlistItem
        db.query.return_value.filter.return_value.first.return_value = WatchlistItem(id=1, user_id=1, ticker="AAPL")
        with patch.object(service.xbrl_client, "get_company_financials", return_value=make_financials("AAPL")):
            with patch.object(service, "_get_cik", return_value="0001234567"):
                result = service.compare_metrics(user_id=1, tickers=["AAPL", "MSFT"])
        assert len(result) == 2

    def test_estructura_del_resultado(self, service, db):
        from app.models.models import WatchlistItem
        db.query.return_value.filter.return_value.first.return_value = WatchlistItem(id=1, user_id=1, ticker="AAPL")
        with patch.object(service.xbrl_client, "get_company_financials", return_value=make_financials("AAPL")):
            with patch.object(service, "_get_cik", return_value="0001234567"):
                result = service.compare_metrics(user_id=1, tickers=["AAPL"])
        keys = result[0].keys()
        assert "ticker" in keys
        assert "revenue" in keys
        assert "net_income" in keys
        assert "eps" in keys
        assert "total_assets" in keys
        assert "total_liabilities" in keys
        assert "financials_available" in keys


class TestUS25EvolucionHistorica:

    def test_ticker_no_en_watchlist_lanza_error(self, service, db):
        from app.core.exceptions import WatchlistItemNotFoundError
        db.query.return_value.filter.return_value.first.return_value = None
        with pytest.raises(WatchlistItemNotFoundError):
            service.compare_history(user_id=1, tickers=["TSLA"], metric="revenue", quarters=8)

    def test_retorna_data_points_para_ticker_con_datos(self, service, db):
        from app.models.models import WatchlistItem
        db.query.return_value.filter.return_value.first.return_value = WatchlistItem(id=1, user_id=1, ticker="AAPL")
        mock_history = {
            "cik": 320193,
            "metric": "revenue",
            "data_points": [
                {"period_end": "2024-09-30", "value": 100_000_000.0, "form": "10-Q", "filed": "2024-11-01"},
                {"period_end": "2024-06-30", "value": 95_000_000.0, "form": "10-Q", "filed": "2024-08-01"},
            ],
            "cached": False,
        }
        with patch.object(service.edgar_service, "get_metric_history", return_value=mock_history):
            with patch.object(service, "_get_cik_int", return_value=320193):
                result = service.compare_history(user_id=1, tickers=["AAPL"], metric="revenue", quarters=8)
        assert result[0]["ticker"] == "AAPL"
        assert len(result[0]["data_points"]) == 2

    def test_ticker_sin_datos_historicos(self, service, db):
        from app.models.models import WatchlistItem
        db.query.return_value.filter.return_value.first.return_value = WatchlistItem(id=1, user_id=1, ticker="XYZ")
        with patch.object(service.edgar_service, "get_metric_history", side_effect=Exception("no data")):
            with patch.object(service, "_get_cik_int", return_value=999999):
                result = service.compare_history(user_id=1, tickers=["XYZ"], metric="revenue", quarters=8)
        assert result[0]["ticker"] == "XYZ"
        assert result[0]["data_points"] == []

    def test_estructura_resultado_historico(self, service, db):
        from app.models.models import WatchlistItem
        db.query.return_value.filter.return_value.first.return_value = WatchlistItem(id=1, user_id=1, ticker="AAPL")
        with patch.object(service.edgar_service, "get_metric_history", return_value={"cik": 1, "metric": "revenue", "data_points": [], "cached": False}):
            with patch.object(service, "_get_cik_int", return_value=1):
                result = service.compare_history(user_id=1, tickers=["AAPL"], metric="revenue", quarters=4)
        keys = result[0].keys()
        assert "ticker" in keys
        assert "data_points" in keys
        assert "quarters_available" in keys

from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

from app.integrations.edgar import CompanyFinancials, FinancialMetric, XbrlClient, _xbrl_cache
from app.models.models import BatchRun, StockPrice
from app.services.edgar_service import CompanyDetailResult, CompanyDetailService, PriceInfo

CIK = "0000320193"
TICKER = "AAPL"

APPLE_FACTS = {
    "facts": {
        "us-gaap": {
            "RevenueFromContractWithCustomerExcludingAssessedTax": {
                "units": {
                    "USD": [
                        {"end": "2022-09-24", "val": 394328000000, "form": "10-K"},
                        {"end": "2023-09-30", "val": 383285000000, "form": "10-K"},
                    ]
                }
            },
            "NetIncomeLoss": {
                "units": {"USD": [{"end": "2023-09-30", "val": 96995000000, "form": "10-K"}]}
            },
            "EarningsPerShareBasic": {
                "units": {"USD/shares": [{"end": "2023-09-30", "val": 6.13, "form": "10-K"}]}
            },
            "Assets": {
                "units": {"USD": [{"end": "2023-09-30", "val": 352583000000, "form": "10-K"}]}
            },
            "Liabilities": {
                "units": {"USD": [{"end": "2023-09-30", "val": 290437000000, "form": "10-K"}]}
            },
        }
    }
}


def _mock_200(payload):
    r = MagicMock()
    r.status_code = 200
    r.json.return_value = payload
    r.raise_for_status.return_value = None
    return r


def full_financials(from_cache=False):
    return CompanyFinancials(
        cik=CIK,
        ticker=TICKER,
        from_cache=from_cache,
        revenue=FinancialMetric("Revenues", 383285000000.0, "USD", "2023-09-30"),
        net_income=FinancialMetric("NetIncomeLoss", 96995000000.0, "USD", "2023-09-30"),
        eps=FinancialMetric("EarningsPerShareBasic", 6.13, "USD/shares", "2023-09-30"),
        total_assets=FinancialMetric("Assets", 352583000000.0, "USD", "2023-09-30"),
        total_liabilities=FinancialMetric("Liabilities", 290437000000.0, "USD", "2023-09-30"),
    )


@pytest.fixture(autouse=True)
def clear_cache():
    _xbrl_cache.clear()
    yield
    _xbrl_cache.clear()


@pytest.fixture
def xbrl_client():
    return XbrlClient()


@pytest.fixture
def mock_xbrl():
    return MagicMock()


@pytest.fixture
def company_detail_service(db, mock_xbrl):
    return CompanyDetailService(db, mock_xbrl)



class TestXbrlCache:
    def test_no_esta_cacheado_inicialmente(self, xbrl_client):
        assert not xbrl_client.is_cached(CIK)

    def test_esta_cacheado_tras_primer_fetch(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(APPLE_FACTS)):
            xbrl_client.get_company_financials(CIK, TICKER)

        assert xbrl_client.is_cached(CIK)

    def test_segunda_llamada_no_hace_request_http(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(APPLE_FACTS)) as mock_get:
            xbrl_client.get_company_financials(CIK, TICKER)
            xbrl_client.get_company_financials(CIK, TICKER)

        assert mock_get.call_count == 1

    def test_primera_llamada_retorna_from_cache_false(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(APPLE_FACTS)):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result.from_cache is False

    def test_segunda_llamada_retorna_from_cache_true(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(APPLE_FACTS)):
            xbrl_client.get_company_financials(CIK, TICKER)
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result.from_cache is True



class TestXbrlParsing:
    def test_retorna_company_financials(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(APPLE_FACTS)):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert isinstance(result, CompanyFinancials)

    def test_extrae_revenue_mas_reciente(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(APPLE_FACTS)):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result.revenue.value == 383285000000
        assert result.revenue.period == "2023-09-30"

    def test_extrae_net_income(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(APPLE_FACTS)):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result.net_income.value == 96995000000

    def test_extrae_eps_con_unidad_correcta(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(APPLE_FACTS)):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result.eps.value == 6.13
        assert result.eps.unit == "USD/shares"

    def test_extrae_total_assets(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(APPLE_FACTS)):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result.total_assets.value == 352583000000

    def test_extrae_total_liabilities(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(APPLE_FACTS)):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result.total_liabilities.value == 290437000000

    def test_prefiere_10k_sobre_10q(self, xbrl_client):
        facts = {"facts": {"us-gaap": {"NetIncomeLoss": {"units": {"USD": [
            {"end": "2023-06-30", "val": 20000, "form": "10-Q"},
            {"end": "2022-09-30", "val": 90000, "form": "10-K"},
        ]}}}}}

        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(facts)):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result.net_income.value == 90000

    def test_retorna_none_si_404(self, xbrl_client):
        r = MagicMock()
        r.status_code = 404

        with patch("app.integrations.edgar.httpx.get", return_value=r):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result is None

    def test_retorna_none_si_no_hay_us_gaap(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200({"facts": {}})):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result is None

    def test_retorna_none_si_excepcion_de_red(self, xbrl_client):
        with patch("app.integrations.edgar.httpx.get", side_effect=Exception("timeout")):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result is None

    def test_metrica_es_none_cuando_no_existe_concepto(self, xbrl_client):
        facts = {"facts": {"us-gaap": {
            "NetIncomeLoss": {"units": {"USD": [{"end": "2023-09-30", "val": 100, "form": "10-K"}]}}
        }}}

        with patch("app.integrations.edgar.httpx.get", return_value=_mock_200(facts)):
            result = xbrl_client.get_company_financials(CIK, TICKER)

        assert result.revenue is None
        assert result.net_income is not None



class TestGetCompanyDetail:
    def test_retorna_company_detail_result(self, company_detail_service, mock_xbrl, db):
        mock_xbrl.get_company_financials.return_value = full_financials()
        db.query.return_value.filter.return_value.first.return_value = None

        result = company_detail_service.get_company_detail(CIK, TICKER)

        assert isinstance(result, CompanyDetailResult)

    def test_llama_al_xbrl_client_con_cik_y_ticker(self, company_detail_service, mock_xbrl, db):
        mock_xbrl.get_company_financials.return_value = full_financials()
        db.query.return_value.filter.return_value.first.return_value = None

        company_detail_service.get_company_detail(CIK, TICKER)

        mock_xbrl.get_company_financials.assert_called_once_with(CIK, TICKER)

    def test_propaga_financials_del_client(self, company_detail_service, mock_xbrl, db):
        financials = full_financials()
        mock_xbrl.get_company_financials.return_value = financials
        db.query.return_value.filter.return_value.first.return_value = None

        result = company_detail_service.get_company_detail(CIK, TICKER)

        assert result.financials is financials

    def test_financials_none_cuando_edgar_no_tiene_datos(self, company_detail_service, mock_xbrl, db):
        mock_xbrl.get_company_financials.return_value = None
        db.query.return_value.filter.return_value.first.return_value = None

        result = company_detail_service.get_company_detail(CIK, TICKER)

        assert result.financials is None


class TestPrecioEnDetalle:
    def test_precio_disponible_cuando_ticker_esta_en_sistema(self, company_detail_service, mock_xbrl, db):
        mock_xbrl.get_company_financials.return_value = full_financials()
        db.query.return_value.filter.return_value.first.return_value = StockPrice(ticker=TICKER, price=175.0)
        db.query.return_value.order_by.return_value.first.return_value = BatchRun(
            ran_at=datetime(2024, 6, 1, 12, 0), updated_count=3, failed_count=0
        )

        result = company_detail_service.get_company_detail(CIK, TICKER)

        assert result.price_info is not None
        assert result.price_info.price == 175.0

    def test_precio_none_cuando_ticker_no_esta_en_sistema(self, company_detail_service, mock_xbrl, db):
        mock_xbrl.get_company_financials.return_value = full_financials()
        db.query.return_value.filter.return_value.first.return_value = None

        result = company_detail_service.get_company_detail(CIK, "XYZ")

        assert result.price_info is None

    def test_precio_incluye_fecha_de_ultima_actualizacion(self, company_detail_service, mock_xbrl, db):
        ran_at = datetime(2024, 6, 1, 12, 0)
        mock_xbrl.get_company_financials.return_value = full_financials()
        db.query.return_value.filter.return_value.first.return_value = StockPrice(ticker=TICKER, price=175.0)
        db.query.return_value.order_by.return_value.first.return_value = BatchRun(
            ran_at=ran_at, updated_count=3, failed_count=0
        )

        result = company_detail_service.get_company_detail(CIK, TICKER)

        assert result.price_info.last_updated == ran_at

    def test_last_updated_none_si_no_hay_batch(self, company_detail_service, mock_xbrl, db):
        mock_xbrl.get_company_financials.return_value = full_financials()
        db.query.return_value.filter.return_value.first.return_value = StockPrice(ticker=TICKER, price=175.0)
        db.query.return_value.order_by.return_value.first.return_value = None

        result = company_detail_service.get_company_detail(CIK, TICKER)

        assert result.price_info.last_updated is None
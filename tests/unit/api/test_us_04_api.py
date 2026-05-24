from datetime import datetime
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.api.v1.endpoints.edgar import get_company_detail_service
from app.integrations.edgar import CompanyFinancials, FinancialMetric
from app.main import app
from app.services.edgar_service import CompanyDetailResult, PriceInfo

CIK = "0000320193"
TICKER = "AAPL"
URL = f"/api/v1/edgar/company/{CIK}/financials"


def make_financials(from_cache=False):
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


@pytest.fixture
def edgar_detail_client():
    mock_service = MagicMock()
    app.dependency_overrides[get_company_detail_service] = lambda: mock_service
    yield TestClient(app), mock_service
    app.dependency_overrides.clear()


class TestGetCompanyFinancialsEndpoint:
    def test_get_financials_retorna_200(self, edgar_detail_client):
        c, mock_service = edgar_detail_client
        mock_service.get_company_detail.return_value = CompanyDetailResult(
            cik=CIK, ticker=TICKER, price_info=None, financials=make_financials()
        )

        response = c.get(URL, params={"ticker": TICKER})

        assert response.status_code == 200

    def test_get_financials_retorna_las_cinco_metricas(self, edgar_detail_client):
        c, mock_service = edgar_detail_client
        mock_service.get_company_detail.return_value = CompanyDetailResult(
            cik=CIK, ticker=TICKER, price_info=None, financials=make_financials()
        )

        response = c.get(URL, params={"ticker": TICKER})
        body = response.json()

        assert body["financials_available"] is True
        for metrica in ("revenue", "net_income", "eps", "total_assets", "total_liabilities"):
            assert body[metrica] is not None

    def test_get_financials_cada_metrica_tiene_periodo(self, edgar_detail_client):
        c, mock_service = edgar_detail_client
        mock_service.get_company_detail.return_value = CompanyDetailResult(
            cik=CIK, ticker=TICKER, price_info=None, financials=make_financials()
        )

        response = c.get(URL, params={"ticker": TICKER})
        body = response.json()

        assert body["revenue"]["period"] == "2023-09-30"

    def test_get_financials_retorna_precio_cuando_disponible(self, edgar_detail_client):
        c, mock_service = edgar_detail_client
        mock_service.get_company_detail.return_value = CompanyDetailResult(
            cik=CIK,
            ticker=TICKER,
            price_info=PriceInfo(price=175.0, last_updated=datetime(2024, 6, 1, 12, 0)),
            financials=make_financials(),
        )

        response = c.get(URL, params={"ticker": TICKER})
        body = response.json()

        assert body["price"] == 175.0
        assert body["price_last_updated"] is not None

    def test_get_financials_precio_null_cuando_no_disponible(self, edgar_detail_client):
        c, mock_service = edgar_detail_client
        mock_service.get_company_detail.return_value = CompanyDetailResult(
            cik=CIK, ticker=TICKER, price_info=None, financials=make_financials()
        )

        response = c.get(URL, params={"ticker": TICKER})
        body = response.json()

        assert body["price"] is None
        assert body["price_last_updated"] is None

    def test_get_financials_not_available_cuando_edgar_sin_datos(self, edgar_detail_client):
        c, mock_service = edgar_detail_client
        mock_service.get_company_detail.return_value = CompanyDetailResult(
            cik=CIK, ticker=TICKER, price_info=None, financials=None
        )

        response = c.get(URL, params={"ticker": TICKER})
        body = response.json()

        assert body["financials_available"] is False
        assert body["revenue"] is None

    def test_get_financials_from_cache_true_en_segunda_consulta(self, edgar_detail_client):
        c, mock_service = edgar_detail_client
        mock_service.get_company_detail.return_value = CompanyDetailResult(
            cik=CIK, ticker=TICKER, price_info=None, financials=make_financials(from_cache=True)
        )

        response = c.get(URL, params={"ticker": TICKER})

        assert response.json()["from_cache"] is True

    def test_get_financials_llama_al_service_con_cik_y_ticker(self, edgar_detail_client):
        c, mock_service = edgar_detail_client
        mock_service.get_company_detail.return_value = CompanyDetailResult(
            cik=CIK, ticker=TICKER, price_info=None, financials=None
        )

        c.get(URL, params={"ticker": TICKER})

        mock_service.get_company_detail.assert_called_once_with(CIK, TICKER)
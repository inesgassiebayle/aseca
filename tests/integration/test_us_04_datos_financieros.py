import httpx

from tests.integration.conftest import SERVER_URL

APPLE_CIK = "0000320193"
APPLE_TICKER = "AAPL"
URL = f"{SERVER_URL}/api/v1/edgar/company"


class TestDatosFinancierosIntegracion:
    def test_get_financials_retorna_200(self, api_server):
        response = httpx.get(
            f"{URL}/{APPLE_CIK}/financials",
            params={"ticker": APPLE_TICKER},
            timeout=30,
        )

        assert response.status_code == 200

    def test_get_financials_retorna_campos_requeridos(self, api_server):
        response = httpx.get(
            f"{URL}/{APPLE_CIK}/financials",
            params={"ticker": APPLE_TICKER},
            timeout=30,
        )
        body = response.json()

        assert "cik" in body
        assert "ticker" in body
        assert "financials_available" in body
        assert "from_cache" in body
        assert "price" in body
        assert "price_last_updated" in body

    def test_get_financials_apple_tiene_datos_edgar(self, api_server):
        response = httpx.get(
            f"{URL}/{APPLE_CIK}/financials",
            params={"ticker": APPLE_TICKER},
            timeout=30,
        )

        assert response.json()["financials_available"] is True

    def test_get_financials_apple_revenue_es_positivo(self, api_server):
        response = httpx.get(
            f"{URL}/{APPLE_CIK}/financials",
            params={"ticker": APPLE_TICKER},
            timeout=30,
        )
        body = response.json()

        assert body["revenue"] is not None
        assert body["revenue"]["value"] > 0
        assert body["revenue"]["period"] is not None

    def test_get_financials_apple_tiene_las_cinco_metricas(self, api_server):
        response = httpx.get(
            f"{URL}/{APPLE_CIK}/financials",
            params={"ticker": APPLE_TICKER},
            timeout=30,
        )
        body = response.json()

        for metrica in ("revenue", "net_income", "eps", "total_assets", "total_liabilities"):
            assert body[metrica] is not None

    def test_get_financials_segunda_llamada_usa_cache(self, api_server):
        params = {"ticker": APPLE_TICKER}
        httpx.get(f"{URL}/{APPLE_CIK}/financials", params=params, timeout=30)

        response = httpx.get(f"{URL}/{APPLE_CIK}/financials", params=params, timeout=30)

        assert response.json()["from_cache"] is True

    def test_get_financials_empresa_inexistente_retorna_not_available(self, api_server):
        response = httpx.get(
            f"{URL}/9999999999/financials",
            params={"ticker": "FAKE"},
            timeout=30,
        )

        assert response.status_code == 200
        assert response.json()["financials_available"] is False
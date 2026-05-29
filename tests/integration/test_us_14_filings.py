import httpx

from tests.integration.conftest import SERVER_URL

APPLE_CIK = 320193   # AAPL — empresa con filings 10-K y 10-Q garantizados


class TestGetFilingsIntegracion:
    def test_retorna_200(self, api_server):
        response = httpx.get(f"{SERVER_URL}/api/v1/edgar/companies/{APPLE_CIK}/filings", timeout=30)

        assert response.status_code == 200

    def test_retorna_filings_de_apple(self, api_server):
        response = httpx.get(f"{SERVER_URL}/api/v1/edgar/companies/{APPLE_CIK}/filings", timeout=30)
        body = response.json()

        assert len(body["filings"]) > 0

    def test_solo_10k_y_10q(self, api_server):
        response = httpx.get(f"{SERVER_URL}/api/v1/edgar/companies/{APPLE_CIK}/filings", timeout=30)
        body = response.json()

        for filing in body["filings"]:
            assert filing["type"] in ("10-K", "10-Q")

    def test_cada_filing_tiene_tipo_fecha_url(self, api_server):
        response = httpx.get(f"{SERVER_URL}/api/v1/edgar/companies/{APPLE_CIK}/filings", timeout=30)
        body = response.json()

        for filing in body["filings"]:
            assert "type" in filing
            assert "date" in filing
            assert "url" in filing
            assert "sec.gov" in filing["url"]

    def test_message_es_none_cuando_hay_filings(self, api_server):
        response = httpx.get(f"{SERVER_URL}/api/v1/edgar/companies/{APPLE_CIK}/filings", timeout=30)
        body = response.json()

        assert body["message"] is None

    def test_cache_segunda_llamada_es_rapida(self, api_server):
        import time
        httpx.get(f"{SERVER_URL}/api/v1/edgar/companies/{APPLE_CIK}/filings", timeout=30)

        t0 = time.perf_counter()
        response = httpx.get(f"{SERVER_URL}/api/v1/edgar/companies/{APPLE_CIK}/filings", timeout=10)
        elapsed = time.perf_counter() - t0

        assert response.status_code == 200
        assert elapsed < 1.0
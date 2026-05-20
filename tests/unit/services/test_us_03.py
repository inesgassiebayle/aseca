from datetime import datetime, timedelta
from unittest.mock import MagicMock
from app.services.edgar_service import EdgarService, TtlCache

MOCK_TICKERS = {
    "0": {"cik_str": 320193, "ticker": "AAPL", "title": "Apple Inc."},
    "1": {"cik_str": 789019, "ticker": "MSFT", "title": "Microsoft Corp"},
    "2": {"cik_str": 1018724, "ticker": "AMZN", "title": "Amazon.com Inc."},
}


class TestBusquedaEmpresaPorNombre:
    def test_busqueda_nombre_parcial_retorna_coincidencias(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_TICKERS

        results = edgar_service.search_companies("apple")

        assert len(results) == 1
        assert results[0]["name"] == "Apple Inc."
        assert results[0]["ticker"] == "AAPL"
        assert results[0]["cik"] == 320193

    def test_busqueda_nombre_case_insensitive(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_TICKERS

        results = edgar_service.search_companies("MICROSOFT")

        assert len(results) == 1
        assert results[0]["name"] == "Microsoft Corp"

    def test_busqueda_nombre_parcial_retorna_multiples_coincidencias(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = {
            "0": {"cik_str": 1, "ticker": "AMZN", "title": "Amazon.com Inc."},
            "1": {"cik_str": 2, "ticker": "AMZP", "title": "Amazon Prime Corp"},
        }

        results = edgar_service.search_companies("amazon")

        assert len(results) == 2


class TestBusquedaEmpresaPorTicker:
    def test_busqueda_ticker_exacto_retorna_empresa(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_TICKERS

        results = edgar_service.search_companies("AAPL")

        assert any(r["ticker"] == "AAPL" for r in results)

    def test_busqueda_ticker_parcial_retorna_coincidencias(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_TICKERS

        results = edgar_service.search_companies("AAP")

        assert any(r["ticker"] == "AAPL" for r in results)

    def test_busqueda_ticker_minusculas_retorna_empresa(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_TICKERS

        results = edgar_service.search_companies("aapl")

        assert any(r["ticker"] == "AAPL" for r in results)

    def test_busqueda_ticker_parcial_minusculas(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_TICKERS

        results = edgar_service.search_companies("msf")

        assert any(r["ticker"] == "MSFT" for r in results)


class TestBusquedaSinResultados:
    def test_busqueda_sin_coincidencias_retorna_lista_vacia(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_TICKERS

        results = edgar_service.search_companies("xyznotfound")

        assert results == []

    def test_llama_edgar_con_user_agent(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = {}

        edgar_service.search_companies("apple")

        call_kwargs = mock_http_client.get.call_args
        assert "User-Agent" in call_kwargs.kwargs.get("headers", {})


class TestCacheEdgar:
    def test_segunda_busqueda_no_llama_http(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_TICKERS

        edgar_service.search_companies("apple")
        edgar_service.search_companies("microsoft")

        mock_http_client.get.assert_called_once()

    def test_cache_expirado_vuelve_a_llamar_http(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_TICKERS

        edgar_service.search_companies("apple")
        edgar_service.cache._expires_at = datetime.now() - timedelta(seconds=1)
        edgar_service.search_companies("apple")

        assert mock_http_client.get.call_count == 2

    def test_cache_vigente_devuelve_mismos_datos(self, edgar_service, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_TICKERS

        first = edgar_service.search_companies("apple")
        second = edgar_service.search_companies("apple")

        assert first == second
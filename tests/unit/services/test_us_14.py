from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest

from app.services.edgar_service import EdgarService, TtlKeyedCache

CIK = 320193

MOCK_SUBMISSIONS = {
    "filings": {
        "recent": {
            "form":            ["10-K",               "10-Q",               "8-K",                "10-Q",               "DEF 14A"],
            "filingDate":      ["2023-10-27",          "2023-07-28",         "2023-08-04",         "2023-04-28",         "2023-01-19"],
            "accessionNumber": ["0000320193-23-000106","0000320193-23-000077","0000320193-23-000082","0000320193-23-000045","0000320193-23-000001"],
            "primaryDocument": ["aapl20230930.htm",    "aapl20230701.htm",   "aapl8k.htm",         "aapl20230401.htm",   "proxy.htm"],
        }
    }
}

MOCK_SUBMISSIONS_SIN_FILINGS = {
    "filings": {
        "recent": {
            "form":            ["8-K", "DEF 14A"],
            "filingDate":      ["2023-08-04", "2023-01-19"],
            "accessionNumber": ["0000320193-23-000082", "0000320193-23-000001"],
            "primaryDocument": ["aapl8k.htm", "proxy.htm"],
        }
    }
}


@pytest.fixture
def edgar_service_con_filings_cache(mock_http_client):
    return EdgarService(mock_http_client)


class TestGetFilings:
    def test_retorna_solo_10k_y_10q(self, edgar_service_con_filings_cache, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_SUBMISSIONS

        result = edgar_service_con_filings_cache.get_filings(CIK)

        assert len(result) == 3
        assert all(f["type"] in ("10-K", "10-Q") for f in result)

    def test_excluye_otros_tipos(self, edgar_service_con_filings_cache, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_SUBMISSIONS

        result = edgar_service_con_filings_cache.get_filings(CIK)

        types = [f["type"] for f in result]
        assert "8-K" not in types
        assert "DEF 14A" not in types

    def test_retorna_tipo_fecha_y_url(self, edgar_service_con_filings_cache, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_SUBMISSIONS

        result = edgar_service_con_filings_cache.get_filings(CIK)

        for filing in result:
            assert "type" in filing
            assert "date" in filing
            assert "url" in filing

    def test_url_apunta_a_edgar(self, edgar_service_con_filings_cache, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_SUBMISSIONS

        result = edgar_service_con_filings_cache.get_filings(CIK)

        for filing in result:
            assert "sec.gov" in filing["url"]
            assert filing["type"] in filing["url"] or filing["url"].endswith(".htm")

    def test_url_no_contiene_guiones_en_accession(self, edgar_service_con_filings_cache, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_SUBMISSIONS

        result = edgar_service_con_filings_cache.get_filings(CIK)

        # accession number in URL should have dashes removed
        for filing in result:
            assert "0000320193-23" not in filing["url"]

    def test_retorna_lista_vacia_si_no_hay_10k_10q(self, edgar_service_con_filings_cache, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_SUBMISSIONS_SIN_FILINGS

        result = edgar_service_con_filings_cache.get_filings(CIK)

        assert result == []

    def test_llama_edgar_con_user_agent(self, edgar_service_con_filings_cache, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_SUBMISSIONS

        edgar_service_con_filings_cache.get_filings(CIK)

        call_kwargs = mock_http_client.get.call_args
        assert "User-Agent" in call_kwargs.kwargs.get("headers", {})

    def test_llama_url_de_submissions_con_cik(self, edgar_service_con_filings_cache, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_SUBMISSIONS

        edgar_service_con_filings_cache.get_filings(CIK)

        url_llamada = mock_http_client.get.call_args.args[0]
        assert str(CIK).zfill(10) in url_llamada


class TestFilingsCache:
    def test_segunda_llamada_no_consulta_edgar(self, edgar_service_con_filings_cache, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_SUBMISSIONS

        edgar_service_con_filings_cache.get_filings(CIK)
        edgar_service_con_filings_cache.get_filings(CIK)

        mock_http_client.get.assert_called_once()

    def test_cache_separado_por_cik(self, edgar_service_con_filings_cache, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_SUBMISSIONS

        edgar_service_con_filings_cache.get_filings(320193)
        edgar_service_con_filings_cache.get_filings(789019)

        assert mock_http_client.get.call_count == 2

    def test_cache_expirado_vuelve_a_llamar_edgar(self, edgar_service_con_filings_cache, mock_http_client):
        mock_http_client.get.return_value.json.return_value = MOCK_SUBMISSIONS

        edgar_service_con_filings_cache.get_filings(CIK)
        edgar_service_con_filings_cache.filings_cache._data[str(CIK)] = (
            [],
            datetime.now() - timedelta(seconds=1),
        )
        edgar_service_con_filings_cache.get_filings(CIK)

        assert mock_http_client.get.call_count == 2
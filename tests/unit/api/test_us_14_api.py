from unittest.mock import MagicMock

import pytest

from app.api.v1.endpoints.edgar import get_edgar_service
from app.main import app
from fastapi.testclient import TestClient

FILINGS = [
    {"type": "10-K", "date": "2023-10-27", "url": "https://www.sec.gov/Archives/edgar/data/320193/000032019323000106/aapl20230930.htm"},
    {"type": "10-Q", "date": "2023-07-28", "url": "https://www.sec.gov/Archives/edgar/data/320193/000032019323000077/aapl20230701.htm"},
]


@pytest.fixture
def edgar_client():
    mock_service = MagicMock()
    app.dependency_overrides[get_edgar_service] = lambda: mock_service
    yield TestClient(app), mock_service
    app.dependency_overrides.clear()


class TestGetFilingsAPI:
    def test_retorna_200_con_filings(self, edgar_client):
        c, mock_service = edgar_client
        mock_service.get_filings.return_value = FILINGS

        response = c.get("/api/v1/edgar/companies/320193/filings")

        assert response.status_code == 200

    def test_retorna_lista_de_filings(self, edgar_client):
        c, mock_service = edgar_client
        mock_service.get_filings.return_value = FILINGS

        response = c.get("/api/v1/edgar/companies/320193/filings")
        body = response.json()

        assert len(body["filings"]) == 2
        assert body["filings"][0]["type"] == "10-K"
        assert body["filings"][0]["date"] == "2023-10-27"
        assert "url" in body["filings"][0]

    def test_llama_al_service_con_cik(self, edgar_client):
        c, mock_service = edgar_client
        mock_service.get_filings.return_value = FILINGS

        c.get("/api/v1/edgar/companies/320193/filings")

        mock_service.get_filings.assert_called_once_with(320193)

    def test_sin_filings_retorna_200_con_mensaje(self, edgar_client):
        c, mock_service = edgar_client
        mock_service.get_filings.return_value = []

        response = c.get("/api/v1/edgar/companies/320193/filings")
        body = response.json()

        assert response.status_code == 200
        assert body["filings"] == []
        assert body["message"] is not None

    def test_con_filings_message_es_none(self, edgar_client):
        c, mock_service = edgar_client
        mock_service.get_filings.return_value = FILINGS

        response = c.get("/api/v1/edgar/companies/320193/filings")
        body = response.json()

        assert body["message"] is None
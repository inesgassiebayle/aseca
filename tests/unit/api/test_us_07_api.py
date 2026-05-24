from datetime import datetime
from unittest.mock import MagicMock

import pytest

from app.main import app
from app.api.v1.endpoints.prices import get_price_service
from fastapi.testclient import TestClient


@pytest.fixture
def prices_client():
    mock_service = MagicMock()
    app.dependency_overrides[get_price_service] = lambda: mock_service
    yield TestClient(app), mock_service
    app.dependency_overrides.clear()


class TestBatchEndpoint:
    def test_post_batch_retorna_200(self, prices_client):
        c, mock_service = prices_client
        mock_service.run_batch.return_value = MagicMock(
            updated=3, failed=0, ran_at=datetime(2024, 6, 1, 12, 0, 0)
        )

        response = c.post("/api/v1/prices/batch")

        assert response.status_code == 200

    def test_post_batch_retorna_reporte(self, prices_client):
        c, mock_service = prices_client
        mock_service.run_batch.return_value = MagicMock(
            updated=3, failed=1, ran_at=datetime(2024, 6, 1, 12, 0, 0)
        )

        response = c.post("/api/v1/prices/batch")
        body = response.json()

        assert body["updated"] == 3
        assert body["failed"] == 1
        assert "ran_at" in body

    def test_post_batch_llama_al_service(self, prices_client):
        c, mock_service = prices_client
        mock_service.run_batch.return_value = MagicMock(
            updated=0, failed=0, ran_at=datetime(2024, 6, 1, 12, 0, 0)
        )

        c.post("/api/v1/prices/batch")

        mock_service.run_batch.assert_called_once()

    def test_post_batch_con_cero_tickers(self, prices_client):
        c, mock_service = prices_client
        mock_service.run_batch.return_value = MagicMock(
            updated=0, failed=0, ran_at=datetime(2024, 6, 1, 12, 0, 0)
        )

        response = c.post("/api/v1/prices/batch")
        body = response.json()

        assert body["updated"] == 0
        assert body["failed"] == 0


class TestGetTickerPriceEndpoint:
    def test_retorna_precio_si_existe(self, prices_client):
        c, mock_service = prices_client
        mock_service.get_price.return_value = 175.5

        response = c.get("/api/v1/prices/AAPL")
        body = response.json()

        assert response.status_code == 200
        assert body["ticker"] == "AAPL"
        assert body["price"] == 175.5

    def test_retorna_precio_null_si_no_existe(self, prices_client):
        c, mock_service = prices_client
        mock_service.get_price.return_value = None

        response = c.get("/api/v1/prices/XYZ")
        body = response.json()

        assert response.status_code == 200
        assert body["price"] is None

    def test_llama_al_service_con_ticker(self, prices_client):
        c, mock_service = prices_client
        mock_service.get_price.return_value = 100.0

        c.get("/api/v1/prices/MSFT")

        mock_service.get_price.assert_called_once_with("MSFT")


class TestLastUpdateEndpoint:
    def test_get_last_update_retorna_200(self, prices_client):
        c, mock_service = prices_client
        mock_service.get_last_update.return_value = datetime(2024, 6, 1, 12, 0, 0)

        response = c.get("/api/v1/prices/last-update")

        assert response.status_code == 200

    def test_get_last_update_retorna_fecha(self, prices_client):
        c, mock_service = prices_client
        mock_service.get_last_update.return_value = datetime(2024, 6, 1, 12, 0, 0)

        response = c.get("/api/v1/prices/last-update")
        body = response.json()

        assert body["last_update"] is not None

    def test_get_last_update_cuando_no_hay_batch(self, prices_client):
        c, mock_service = prices_client
        mock_service.get_last_update.return_value = None

        response = c.get("/api/v1/prices/last-update")
        body = response.json()

        assert response.status_code == 200
        assert body["last_update"] is None

    def test_get_last_update_llama_al_service(self, prices_client):
        c, mock_service = prices_client
        mock_service.get_last_update.return_value = None

        c.get("/api/v1/prices/last-update")

        mock_service.get_last_update.assert_called_once()
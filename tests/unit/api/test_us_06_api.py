from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.v1.endpoints.edgar import get_edgar_service
from app.db.session import get_db

MOCK_HISTORY = {
    "cik": 1652044,
    "metric": "revenue",
    "data_points": [
        {"period_end": "2024-09-30", "value": 88268000000.0, "form": "10-Q", "filed": "2024-10-29"},
        {"period_end": "2024-06-30", "value": 84742000000.0, "form": "10-Q", "filed": "2024-07-30"},
        {"period_end": "2024-03-31", "value": 80539000000.0, "form": "10-Q", "filed": "2024-04-29"},
        {"period_end": "2023-12-31", "value": 307394000000.0, "form": "10-K", "filed": "2024-01-31"},
    ],
    "cached": False,
}


@pytest.fixture
def mock_service():
    svc = MagicMock()
    svc.get_metric_history.return_value = MOCK_HISTORY
    return svc


@pytest.fixture
def client(mock_service):
    db = MagicMock()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_edgar_service] = lambda: mock_service
    yield TestClient(app)
    app.dependency_overrides.clear()


class TestGetMetricHistoryEndpoint:
    def test_revenue_retorna_200(self, client):
        assert client.get("/api/v1/edgar/companies/1652044/metrics/revenue").status_code == 200

    def test_net_income_retorna_200(self, client, mock_service):
        mock_service.get_metric_history.return_value = {**MOCK_HISTORY, "metric": "net_income"}
        assert client.get("/api/v1/edgar/companies/1652044/metrics/net_income").status_code == 200

    def test_eps_retorna_200(self, client, mock_service):
        mock_service.get_metric_history.return_value = {**MOCK_HISTORY, "metric": "eps"}
        assert client.get("/api/v1/edgar/companies/1652044/metrics/eps").status_code == 200

    def test_respuesta_tiene_estructura_correcta(self, client):
        body = client.get("/api/v1/edgar/companies/1652044/metrics/revenue").json()
        assert "cik" in body
        assert "metric" in body
        assert "data_points" in body
        assert "cached" in body

    def test_cada_data_point_tiene_campos_requeridos(self, client):
        body = client.get("/api/v1/edgar/companies/1652044/metrics/revenue").json()
        for dp in body["data_points"]:
            assert "period_end" in dp
            assert "value" in dp
            assert "form" in dp
            assert "filed" in dp

    def test_lista_vacia_cuando_no_hay_datos(self, client, mock_service):
        mock_service.get_metric_history.return_value = {
            "cik": 9999999, "metric": "revenue", "data_points": [], "cached": False
        }
        body = client.get("/api/v1/edgar/companies/9999999/metrics/revenue").json()
        assert body["data_points"] == []

    def test_cached_true_se_refleja_en_respuesta(self, client, mock_service):
        mock_service.get_metric_history.return_value = {**MOCK_HISTORY, "cached": True}
        body = client.get("/api/v1/edgar/companies/1652044/metrics/revenue").json()
        assert body["cached"] is True


class TestQuartersParam:
    def test_default_es_8(self, client, mock_service):
        client.get("/api/v1/edgar/companies/1652044/metrics/revenue")
        mock_service.get_metric_history.assert_called_once_with(
            cik=1652044, metric="revenue", quarters=8
        )

    def test_quarters_4_se_pasa_al_servicio(self, client, mock_service):
        client.get("/api/v1/edgar/companies/1652044/metrics/revenue?quarters=4")
        mock_service.get_metric_history.assert_called_once_with(
            cik=1652044, metric="revenue", quarters=4
        )

    def test_quarters_mayor_a_8_retorna_422(self, client):
        assert client.get("/api/v1/edgar/companies/1652044/metrics/revenue?quarters=9").status_code == 422

    def test_quarters_0_retorna_422(self, client):
        assert client.get("/api/v1/edgar/companies/1652044/metrics/revenue?quarters=0").status_code == 422


class TestErrorHandling:
    def test_metrica_invalida_retorna_422(self, client, mock_service):
        mock_service.get_metric_history.side_effect = ValueError("Metrica no soportada: 'bad'")
        assert client.get("/api/v1/edgar/companies/1652044/metrics/bad").status_code == 422

    def test_detail_incluye_mensaje_de_error(self, client, mock_service):
        mock_service.get_metric_history.side_effect = ValueError("Metrica no soportada: 'bad'")
        body = client.get("/api/v1/edgar/companies/1652044/metrics/bad").json()
        assert "detail" in body
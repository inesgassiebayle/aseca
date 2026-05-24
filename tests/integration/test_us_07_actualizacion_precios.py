import httpx

from tests.integration.conftest import SERVER_URL


class TestBatchIntegracion:
    def test_post_batch_retorna_200(self, api_server):
        response = httpx.post(f"{SERVER_URL}/api/v1/prices/batch", timeout=300)

        assert response.status_code == 200

    def test_post_batch_retorna_campos_requeridos(self, api_server):
        response = httpx.post(f"{SERVER_URL}/api/v1/prices/batch", timeout=300)
        body = response.json()

        assert "updated" in body
        assert "failed" in body
        assert "ran_at" in body
        assert "failed_tickers" in body
        assert isinstance(body["updated"], int)
        assert isinstance(body["failed"], int)
        assert isinstance(body["failed_tickers"], list)

    def test_post_batch_actualiza_al_menos_un_ticker(self, api_server):
        response = httpx.post(f"{SERVER_URL}/api/v1/prices/batch", timeout=300)
        body = response.json()

        assert body["updated"] > 0

    def test_post_batch_guarda_fecha_de_ejecucion(self, api_server):
        httpx.post(f"{SERVER_URL}/api/v1/prices/batch", timeout=300)

        response = httpx.get(f"{SERVER_URL}/api/v1/prices/last-update", timeout=10)

        assert response.status_code == 200
        assert response.json()["last_update"] is not None


class TestLastUpdateIntegracion:
    def test_get_last_update_retorna_200(self, api_server):
        response = httpx.get(f"{SERVER_URL}/api/v1/prices/last-update", timeout=10)

        assert response.status_code == 200

    def test_get_last_update_contiene_campo_last_update(self, api_server):
        response = httpx.get(f"{SERVER_URL}/api/v1/prices/last-update", timeout=10)

        assert "last_update" in response.json()

    def test_get_last_update_despues_de_batch_retorna_fecha(self, api_server):
        httpx.post(f"{SERVER_URL}/api/v1/prices/batch", timeout=300)

        response = httpx.get(f"{SERVER_URL}/api/v1/prices/last-update", timeout=10)

        assert response.json()["last_update"] is not None
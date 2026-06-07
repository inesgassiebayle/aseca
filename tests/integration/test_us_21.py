import uuid
import httpx
import pytest

from tests.integration.conftest import SERVER_URL

TEST_PASSWORD = "IntegrationPass123"


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


class TestWatchlistIntegracion:

    @pytest.fixture(autouse=True)
    def setup(self, api_server):
        unique_email = f"watchlist_{uuid.uuid4().hex[:8]}@test.com"
        httpx.post(
            f"{SERVER_URL}/api/v1/auth/register",
            json={"email": unique_email, "password": TEST_PASSWORD},
            timeout=10,
        )
        resp = httpx.post(
            f"{SERVER_URL}/api/v1/auth/login",
            json={"email": unique_email, "password": TEST_PASSWORD},
            timeout=10,
        )
        self.token = resp.json()["access_token"]

    def test_agregar_ticker_retorna_201(self):
        resp = httpx.post(
            f"{SERVER_URL}/api/v1/watchlist/",
            json={"ticker": "TSLA"},
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.status_code == 201

    def test_agregar_ticker_retorna_ticker_en_body(self):
        resp = httpx.post(
            f"{SERVER_URL}/api/v1/watchlist/",
            json={"ticker": "tsla"},
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.json()["ticker"] == "TSLA"

    def test_ticker_duplicado_retorna_409(self):
        httpx.post(
            f"{SERVER_URL}/api/v1/watchlist/",
            json={"ticker": "TSLA"},
            headers=auth_headers(self.token),
            timeout=10,
        )
        resp = httpx.post(
            f"{SERVER_URL}/api/v1/watchlist/",
            json={"ticker": "TSLA"},
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.status_code == 409

    def test_sin_autenticacion_retorna_401(self):
        resp = httpx.post(
            f"{SERVER_URL}/api/v1/watchlist/",
            json={"ticker": "TSLA"},
            timeout=10,
        )
        assert resp.status_code == 401
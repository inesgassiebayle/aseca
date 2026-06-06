import uuid

import httpx
import pytest

from tests.integration.conftest import SERVER_URL

TEST_EMAIL = "portfolio_integration@test.com"
TEST_PASSWORD = "IntegrationPass123"
TICKER = "AAPL"


def register_and_login() -> str:
    httpx.post(
        f"{SERVER_URL}/api/v1/auth/register",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=10,
    )
    resp = httpx.post(
        f"{SERVER_URL}/api/v1/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=10,
    )
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def seed_price(token: str):
    """Inserta precio directo via SQLite para poder comprar."""
    from sqlalchemy import create_engine, text
    from tests.integration.conftest import TEST_DB_URL
    from datetime import datetime, timezone

    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    with engine.connect() as conn:
        conn.execute(
            text("INSERT OR IGNORE INTO stock_prices (ticker, price, updated_at) VALUES (:ticker, :price, :updated_at)"),
            {"ticker": TICKER, "price": 214.30, "updated_at": datetime.now(timezone.utc).isoformat()},
        )
        conn.commit()
    engine.dispose()


class TestGestionPortfolioIntegracion:

    @pytest.fixture(autouse=True)
    def setup(self, api_server):
        unique_email = f"portfolio_{uuid.uuid4().hex[:8]}@test.com"

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
        seed_price(self.token)

    def test_compra_exitosa_persiste_operacion(self):
        resp = httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/buy",
            json={"ticker": TICKER, "quantity": 10},
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["ticker"] == TICKER
        assert body["type"] == "buy"
        assert body["quantity"] == 10
        assert body["price"] == 214.30

    def test_compra_actualiza_portfolio(self):
        httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/buy",
            json={"ticker": TICKER, "quantity": 10},
            headers=auth_headers(self.token),
            timeout=10,
        )
        resp = httpx.get(
            f"{SERVER_URL}/api/v1/portfolio/",
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.status_code == 200
        positions = resp.json()
        assert len(positions) == 1
        assert positions[0]["ticker"] == TICKER
        assert positions[0]["quantity"] == 10

    def test_compra_ticker_sin_precio_retorna_422(self):
        resp = httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/buy",
            json={"ticker": "XYZ", "quantity": 10},
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.status_code == 422

    def test_venta_exitosa_reduce_posicion(self):
        httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/buy",
            json={"ticker": TICKER, "quantity": 10},
            headers=auth_headers(self.token),
            timeout=10,
        )
        resp = httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/sell",
            json={"ticker": TICKER, "quantity": 5},
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.status_code == 201
        assert resp.json()["type"] == "sell"

        portfolio = httpx.get(
            f"{SERVER_URL}/api/v1/portfolio/",
            headers=auth_headers(self.token),
            timeout=10,
        ).json()
        assert portfolio[0]["quantity"] == 5

    def test_venta_cierra_posicion(self):
        httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/buy",
            json={"ticker": TICKER, "quantity": 10},
            headers=auth_headers(self.token),
            timeout=10,
        )
        httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/sell",
            json={"ticker": TICKER, "quantity": 10},
            headers=auth_headers(self.token),
            timeout=10,
        )
        portfolio = httpx.get(
            f"{SERVER_URL}/api/v1/portfolio/",
            headers=auth_headers(self.token),
            timeout=10,
        ).json()
        assert len(portfolio) == 0

    def test_venta_mayor_a_disponible_retorna_422(self):
        httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/buy",
            json={"ticker": TICKER, "quantity": 5},
            headers=auth_headers(self.token),
            timeout=10,
        )
        resp = httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/sell",
            json={"ticker": TICKER, "quantity": 10},
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.status_code == 422

    def test_venta_ticker_no_poseido_retorna_422(self):
        resp = httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/sell",
            json={"ticker": TICKER, "quantity": 5},
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.status_code == 422

    def test_historial_retorna_operaciones_ordenadas(self):
        httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/buy",
            json={"ticker": TICKER, "quantity": 10},
            headers=auth_headers(self.token),
            timeout=10,
        )
        httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/sell",
            json={"ticker": TICKER, "quantity": 5},
            headers=auth_headers(self.token),
            timeout=10,
        )
        resp = httpx.get(
            f"{SERVER_URL}/api/v1/operations/",
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.status_code == 200
        ops = resp.json()
        assert len(ops) == 2
        assert ops[0]["type"] == "sell"
        assert ops[1]["type"] == "buy"

    def test_portfolio_muestra_pnl(self):
        httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/buy",
            json={"ticker": TICKER, "quantity": 10},
            headers=auth_headers(self.token),
            timeout=10,
        )
        resp = httpx.get(
            f"{SERVER_URL}/api/v1/portfolio/",
            headers=auth_headers(self.token),
            timeout=10,
        )
        position = resp.json()[0]
        assert "pnl" in position
        assert "pnl_pct" in position
        assert position["pnl"] == 0.0
        assert position["pnl_pct"] == 0.0

    def test_detalle_posicion_retorna_datos_completos(self):
        httpx.post(
            f"{SERVER_URL}/api/v1/portfolio/buy",
            json={"ticker": TICKER, "quantity": 10},
            headers=auth_headers(self.token),
            timeout=10,
        )
        resp = httpx.get(
            f"{SERVER_URL}/api/v1/portfolio/{TICKER}",
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["ticker"] == TICKER
        assert body["quantity"] == 10
        assert "pnl" in body
        assert "operations" in body
        assert len(body["operations"]) == 1

    def test_detalle_posicion_inexistente_retorna_404(self):
        resp = httpx.get(
            f"{SERVER_URL}/api/v1/portfolio/TSLA",
            headers=auth_headers(self.token),
            timeout=10,
        )
        assert resp.status_code == 404

    def test_sin_autenticacion_retorna_401(self):
        resp = httpx.get(f"{SERVER_URL}/api/v1/portfolio/", timeout=10)
        assert resp.status_code == 401
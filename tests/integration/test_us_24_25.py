import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base
from app.core.dependencies import get_db, get_current_user
from app.models.models import User, WatchlistItem
from app.integrations.edgar import CompanyFinancials, FinancialMetric

DATABASE_URL = "sqlite:///./test_us24_25.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    user = User(id=1, email="test@test.com", hashed_password="x")
    db.add(user)
    db.add(WatchlistItem(user_id=1, ticker="AAPL"))
    db.add(WatchlistItem(user_id=1, ticker="MSFT"))
    db.commit()

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: user
    yield TestClient(app)
    app.dependency_overrides.clear()


def make_financials(ticker: str) -> CompanyFinancials:
    return CompanyFinancials(
        cik="0001234567", ticker=ticker, from_cache=False,
        revenue=FinancialMetric(concept="Revenues", value=100_000_000.0, unit="USD", period="2024-09-30"),
        net_income=FinancialMetric(concept="NetIncomeLoss", value=20_000_000.0, unit="USD", period="2024-09-30"),
        eps=FinancialMetric(concept="EarningsPerShareBasic", value=1.5, unit="USD/shares", period="2024-09-30"),
        total_assets=FinancialMetric(concept="Assets", value=500_000_000.0, unit="USD", period="2024-09-30"),
        total_liabilities=FinancialMetric(concept="Liabilities", value=200_000_000.0, unit="USD", period="2024-09-30"),
    )


class TestCompareMetricsIntegracion:

    def test_retorna_200_con_tickers_validos(self, client):
        with patch("app.services.watchlist_compare_service.WatchlistCompareService._get_cik", return_value="0001234567"):
            with patch("app.integrations.edgar.XbrlClient.get_company_financials", return_value=make_financials("AAPL")):
                res = client.get("/api/v1/watchlist/compare?tickers=AAPL")
        assert res.status_code == 200

    def test_retorna_404_si_ticker_no_en_watchlist(self, client):
        res = client.get("/api/v1/watchlist/compare?tickers=TSLA")
        assert res.status_code == 404

    def test_estructura_response(self, client):
        with patch("app.services.watchlist_compare_service.WatchlistCompareService._get_cik", return_value="0001234567"):
            with patch("app.integrations.edgar.XbrlClient.get_company_financials", return_value=make_financials("AAPL")):
                res = client.get("/api/v1/watchlist/compare?tickers=AAPL")
        data = res.json()
        assert data[0]["ticker"] == "AAPL"
        assert data[0]["financials_available"] is True
        assert data[0]["revenue"] == 100_000_000.0

    def test_ticker_sin_datos_edgar(self, client):
        with patch("app.services.watchlist_compare_service.WatchlistCompareService._get_cik", return_value="0000000001"):
            with patch("app.integrations.edgar.XbrlClient.get_company_financials", return_value=None):
                res = client.get("/api/v1/watchlist/compare?tickers=AAPL")
        assert res.status_code == 200
        assert res.json()[0]["financials_available"] is False
        assert res.json()[0]["revenue"] is None


class TestCompareHistoryIntegracion:

    def test_retorna_200_con_metrica_valida(self, client):
        mock_history = {"cik": 1, "metric": "revenue", "data_points": [], "cached": False}
        with patch("app.services.watchlist_compare_service.WatchlistCompareService._get_cik_int", return_value=1):
            with patch("app.services.edgar_service.EdgarService.get_metric_history", return_value=mock_history):
                res = client.get("/api/v1/watchlist/compare/history?tickers=AAPL&metric=revenue")
        assert res.status_code == 200

    def test_retorna_404_si_ticker_no_en_watchlist(self, client):
        res = client.get("/api/v1/watchlist/compare/history?tickers=TSLA&metric=revenue")
        assert res.status_code == 404

    def test_metrica_invalida_retorna_422(self, client):
        with patch("app.services.watchlist_compare_service.WatchlistCompareService._get_cik_int", return_value=1):
            res = client.get("/api/v1/watchlist/compare/history?tickers=AAPL&metric=precio_magico")
        assert res.status_code == 422

    def test_estructura_response_historico(self, client):
        mock_history = {
            "cik": 1, "metric": "revenue",
            "data_points": [{"period_end": "2024-09-30", "value": 100.0, "form": "10-Q", "filed": "2024-11-01"}],
            "cached": False,
        }
        with patch("app.services.watchlist_compare_service.WatchlistCompareService._get_cik_int", return_value=1):
            with patch("app.services.edgar_service.EdgarService.get_metric_history", return_value=mock_history):
                res = client.get("/api/v1/watchlist/compare/history?tickers=AAPL&metric=revenue&quarters=4")
        data = res.json()
        assert data[0]["ticker"] == "AAPL"
        assert data[0]["quarters_available"] == 1
        assert data[0]["data_points"][0]["period_end"] == "2024-09-30"

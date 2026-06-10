import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import Base
from app.core.dependencies import get_db, get_current_user
from app.models.models import User, WatchlistItem, StockPrice

DATABASE_URL = "sqlite:///./test_us23.db"
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
    db.commit()

    def override_db():
        yield db

    def override_user():
        return user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    yield TestClient(app)
    app.dependency_overrides.clear()


class TestGetWatchlistConPreciosIntegracion:

    def test_watchlist_vacia(self, client):
        res = client.get("/api/v1/watchlist/")
        assert res.status_code == 200
        assert res.json() == []

    def test_ticker_con_precio(self, client, db):
        db.add(WatchlistItem(user_id=1, ticker="AAPL"))
        db.add(StockPrice(ticker="AAPL", price=189.5, updated_at=datetime(2025, 1, 1, 12, 0)))
        db.commit()

        res = client.get("/api/v1/watchlist/")
        assert res.status_code == 200
        data = res.json()
        assert data[0]["ticker"] == "AAPL"
        assert data[0]["price"] == 189.5
        assert data[0]["updated_at"] is not None

    def test_ticker_sin_precio(self, client, db):
        db.add(WatchlistItem(user_id=1, ticker="XYZ"))
        db.commit()

        res = client.get("/api/v1/watchlist/")
        assert res.status_code == 200
        data = res.json()
        assert data[0]["ticker"] == "XYZ"
        assert data[0]["price"] is None
        assert data[0]["updated_at"] is None

    def test_multiples_tickers(self, client, db):
        db.add(WatchlistItem(user_id=1, ticker="AAPL"))
        db.add(WatchlistItem(user_id=1, ticker="TSLA"))
        db.add(StockPrice(ticker="AAPL", price=189.5, updated_at=datetime(2025, 1, 1, 12, 0)))
        db.commit()

        res = client.get("/api/v1/watchlist/")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 2
        aapl = next(d for d in data if d["ticker"] == "AAPL")
        tsla = next(d for d in data if d["ticker"] == "TSLA")
        assert aapl["price"] == 189.5
        assert tsla["price"] is None
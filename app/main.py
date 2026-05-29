from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.api.v1.endpoints import auth, portfolio, operations, watchlist, edgar, prices
from app.core.config import settings
from app.core.whitelist import TICKER_WHITELIST
from app.db.session import Base, engine, SessionLocal
from app.integrations.yahoo_finance import YahooFinanceClient
from app.models import models  # noqa: F401
from app.services.price_service import PriceService


def _run_price_batch() -> None:
    db = SessionLocal()
    try:
        PriceService(db, YahooFinanceClient(), TICKER_WHITELIST).run_batch()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    scheduler = BackgroundScheduler()
    scheduler.add_job(_run_price_batch, CronTrigger(hour=3, minute=0))
    scheduler.start()

    yield

    scheduler.shutdown(wait=False)


app = FastAPI(
    title="ASECA API",
    version="0.1.0",
    description="Portfolio tracker integrating SEC EDGAR and Yahoo Finance",
    lifespan=lifespan,
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(portfolio.router, prefix="/api/v1/portfolio", tags=["portfolio"])
app.include_router(operations.router, prefix="/api/v1/operations", tags=["operations"])
app.include_router(watchlist.router, prefix="/api/v1/watchlist", tags=["watchlist"])
app.include_router(edgar.router, prefix="/api/v1/edgar", tags=["edgar"])
app.include_router(prices.router, prefix="/api/v1/prices", tags=["prices"])


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.APP_VERSION}
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.whitelist import TICKER_WHITELIST
from app.db.session import get_db
from app.integrations.yahoo_finance import YahooFinanceClient
from app.services.price_service import PriceService

router = APIRouter()


class BatchReport(BaseModel):
    updated: int
    failed: int
    ran_at: datetime
    failed_tickers: list[str] = []


class LastUpdateResponse(BaseModel):
    last_update: datetime | None


class TickerPriceResponse(BaseModel):
    ticker: str
    price: float | None


def get_price_service(db: Session = Depends(get_db)) -> PriceService:
    return PriceService(db, YahooFinanceClient(), TICKER_WHITELIST)


@router.post("/batch", response_model=BatchReport)
def run_batch(service: PriceService = Depends(get_price_service)):
    result = service.run_batch()
    return BatchReport(updated=result.updated, failed=result.failed, ran_at=result.ran_at, failed_tickers=result.failed_tickers)


@router.get("/last-update", response_model=LastUpdateResponse)
def last_update(service: PriceService = Depends(get_price_service)):
    return LastUpdateResponse(last_update=service.get_last_update())


@router.get("/{ticker}", response_model=TickerPriceResponse)
def get_ticker_price(ticker: str, service: PriceService = Depends(get_price_service)):
    return TickerPriceResponse(ticker=ticker.upper(), price=service.get_price(ticker.upper()))
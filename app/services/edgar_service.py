from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.integrations.edgar import CompanyFinancials, XbrlClient
from app.models.models import BatchRun, StockPrice

COMPANY_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
CACHE_TTL = timedelta(hours=1)


class TtlCache:
    def __init__(self, ttl: timedelta = CACHE_TTL):
        self._data: dict | None = None
        self._expires_at: datetime | None = None
        self._ttl = ttl

    def get(self) -> dict | None:
        if self._data is not None and datetime.now() < self._expires_at:
            return self._data
        return None

    def set(self, data: dict) -> None:
        self._data = data
        self._expires_at = datetime.now() + self._ttl


class EdgarService:
    def __init__(self, http_client: httpx.Client, cache: TtlCache | None = None):
        self.http_client = http_client
        self.cache = cache if cache is not None else TtlCache()

    def search_companies(self, query: str) -> list[dict]:
        data = self._get_tickers()

        query_upper = query.upper()
        query_lower = query.lower()

        results = []
        for entry in data.values():
            ticker: str = entry["ticker"]
            name: str = entry["title"]
            cik: int = entry["cik_str"]

            if query_upper in ticker.upper() or query_lower in name.lower():
                results.append({"name": name, "ticker": ticker, "cik": cik})

        return results

    def _get_tickers(self) -> dict:
        cached = self.cache.get()
        if cached is not None:
            return cached

        response = self.http_client.get(
            COMPANY_TICKERS_URL,
            headers={"User-Agent": settings.EDGAR_USER_AGENT},
        )
        data = response.json()
        self.cache.set(data)
        return data


@dataclass
class PriceInfo:
    price: float
    last_updated: Optional[datetime]


@dataclass
class CompanyDetailResult:
    cik: str
    ticker: str
    price_info: Optional[PriceInfo]
    financials: Optional[CompanyFinancials]


class CompanyDetailService:
    def __init__(self, db: Session, xbrl_client: XbrlClient):
        self.db = db
        self.xbrl_client = xbrl_client

    def get_company_detail(self, cik: str, ticker: str) -> CompanyDetailResult:
        return CompanyDetailResult(
            cik=cik,
            ticker=ticker,
            price_info=self._get_price_info(ticker),
            financials=self.xbrl_client.get_company_financials(cik, ticker),
        )

    def _get_price_info(self, ticker: str) -> Optional[PriceInfo]:
        if not ticker:
            return None
        record = self.db.query(StockPrice).filter(StockPrice.ticker == ticker.upper()).first()
        if not record:
            return None
        batch = self.db.query(BatchRun).order_by(BatchRun.ran_at.desc()).first()
        return PriceInfo(
            price=record.price,
            last_updated=batch.ran_at if batch else None,
        )
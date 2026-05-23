from __future__ import annotations

from datetime import datetime, timedelta

import httpx

from app.core.config import settings

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

    def get_company(self, ticker: str) -> dict | None:
        data = self._get_tickers()
        ticker_upper = ticker.upper()

        for entry in data.values():
            if entry["ticker"].upper() == ticker_upper:
                return {
                    "ticker": entry["ticker"],
                    "name": entry["title"],
                    "cik": str(entry["cik_str"]).zfill(10),
                    "price": None,
                    "updated_at": None,
                }
        return None
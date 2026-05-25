from datetime import datetime, timedelta
from typing import Optional

import httpx

from app.core.config import settings

COMPANY_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
SUBMISSIONS_URL     = "https://data.sec.gov/submissions/CIK{cik:010d}.json"
FILING_URL          = "https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/{document}"
COMPANY_FACTS_URL   = "https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json"
CACHE_TTL           = timedelta(hours=1)
ALLOWED_FORMS       = {"10-K", "10-Q"}

METRIC_MAP: dict = {
    "revenue": [
        "Revenues",
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "SalesRevenueNet",
        "RevenueFromContractWithCustomerIncludingAssessedTax",
    ],
    "net_income": [
        "NetIncomeLoss",
        "ProfitLoss",
        "NetIncomeLossAvailableToCommonStockholdersBasic",
    ],
    "eps": [
        "EarningsPerShareBasic",
        "EarningsPerShareDiluted",
    ],
}

SUPPORTED_METRICS = set(METRIC_MAP.keys())


class TtlCache:
    def __init__(self, ttl: timedelta = CACHE_TTL):
        self._data: Optional[dict] = None
        self._expires_at: Optional[datetime] = None
        self._ttl = ttl

    def get(self) -> Optional[dict]:
        if self._data is not None and datetime.now() < self._expires_at:
            return self._data
        return None

    def set(self, data: dict) -> None:
        self._data = data
        self._expires_at = datetime.now() + self._ttl


class TtlKeyedCache:
    def __init__(self, ttl: timedelta = CACHE_TTL):
        self._data: dict = {}
        self._ttl = ttl

    def get(self, key: str):
        if key in self._data:
            value, expires_at = self._data[key]
            if datetime.now() < expires_at:
                return value
            del self._data[key]
        return None

    def set(self, key: str, value) -> None:
        self._data[key] = (value, datetime.now() + self._ttl)


class EdgarService:
    def __init__(
        self,
        http_client: httpx.Client,
        cache: Optional[TtlCache] = None,
        filings_cache: Optional[TtlKeyedCache] = None,
        metrics_cache: Optional[TtlKeyedCache] = None,
    ):
        self.http_client   = http_client
        self.cache         = cache         if cache         is not None else TtlCache()
        self.filings_cache = filings_cache if filings_cache is not None else TtlKeyedCache()
        self.metrics_cache = metrics_cache if metrics_cache is not None else TtlKeyedCache()

    def search_companies(self, query: str) -> list:
        data = self._get_tickers()

        query_upper = query.upper()
        query_lower = query.lower()

        results = []
        for entry in data.values():
            ticker: str = entry["ticker"]
            name: str   = entry["title"]
            cik: int    = entry["cik_str"]

            if query_upper in ticker.upper() or query_lower in name.lower():
                results.append({"name": name, "ticker": ticker, "cik": cik})

        return results

    def get_filings(self, cik: int) -> list:
        key = str(cik)
        cached = self.filings_cache.get(key)
        if cached is not None:
            return cached

        response = self.http_client.get(
            SUBMISSIONS_URL.format(cik=cik),
            headers={"User-Agent": settings.EDGAR_USER_AGENT},
        )
        recent = response.json()["filings"]["recent"]

        filings = []
        for form, date, accession, document in zip(
            recent["form"],
            recent["filingDate"],
            recent["accessionNumber"],
            recent["primaryDocument"],
        ):
            if form not in ALLOWED_FORMS:
                continue
            accession_clean = accession.replace("-", "")
            filings.append({
                "type": form,
                "date": date,
                "url":  FILING_URL.format(cik=cik, accession=accession_clean, document=document),
            })

        self.filings_cache.set(key, filings)
        return filings

    def get_metric_history(
        self,
        cik: int,
        metric: str,
        quarters: int = 8,
    ) -> dict:
        if metric not in SUPPORTED_METRICS:
            raise ValueError(
                f"Métrica no soportada: '{metric}'. "
                f"Opciones disponibles: {sorted(SUPPORTED_METRICS)}"
            )

        cache_key = f"{cik}_{metric}"
        cached = self.metrics_cache.get(cache_key)
        if cached is not None:
            return cached

        response = self.http_client.get(
            COMPANY_FACTS_URL.format(cik=cik),
            headers={"User-Agent": settings.EDGAR_USER_AGENT},
        )
        facts = response.json()

        data_points = self._extract_metric_data(facts, metric, quarters)

        result = {
            "cik":         cik,
            "metric":      metric,
            "data_points": data_points,
            "cached":      False,
        }

        self.metrics_cache.set(cache_key, {**result, "cached": True})
        return result

    @staticmethod
    def _extract_metric_data(facts: dict, metric: str, quarters: int) -> list:
        us_gaap = facts.get("facts", {}).get("us-gaap", {})

        entries = []
        for concept_name in METRIC_MAP[metric]:
            if concept_name not in us_gaap:
                continue
            for unit_values in us_gaap[concept_name].get("units", {}).values():
                for entry in unit_values:
                    if entry.get("form") not in ALLOWED_FORMS:
                        continue
                    entries.append({
                        "period_end": entry["end"],
                        "value":      float(entry["val"]),
                        "form":       entry["form"],
                        "filed":      entry.get("filed", ""),
                    })
            break  # primer concepto encontrado gana

        seen = {}
        for entry in entries:
            key = entry["period_end"]
            if key not in seen or entry["filed"] > seen[key]["filed"]:
                seen[key] = entry

        return sorted(seen.values(), key=lambda x: x["period_end"], reverse=True)[:quarters]

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
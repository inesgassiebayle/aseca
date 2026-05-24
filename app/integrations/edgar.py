from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

EDGAR_BASE_URL = "https://data.sec.gov"
EDGAR_HEADERS = {
    "User-Agent": "ASECA Portfolio Tracker contact@aseca.edu.ar",
    "Accept-Encoding": "gzip, deflate",
}
_DEFAULT_TTL = timedelta(hours=1)

_xbrl_cache: dict[str, tuple[datetime, Optional[dict]]] = {}

_REVENUE = [
    "Revenues",
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "RevenueFromContractWithCustomerIncludingAssessedTax",
    "SalesRevenueNet",
]
_NET_INCOME = ["NetIncomeLoss", "NetIncomeLossAvailableToCommonStockholdersBasic"]
_EPS = ["EarningsPerShareBasic", "EarningsPerShareDiluted"]
_ASSETS = ["Assets"]
_LIABILITIES = ["Liabilities"]


@dataclass
class FinancialMetric:
    concept: str
    value: float
    unit: str
    period: str


@dataclass
class CompanyFinancials:
    cik: str
    ticker: str
    from_cache: bool = False
    revenue: Optional[FinancialMetric] = None
    net_income: Optional[FinancialMetric] = None
    eps: Optional[FinancialMetric] = None
    total_assets: Optional[FinancialMetric] = None
    total_liabilities: Optional[FinancialMetric] = None


class XbrlClient:
    def __init__(self, cache_ttl: timedelta = _DEFAULT_TTL):
        self.cache_ttl = cache_ttl

    def is_cached(self, cik: str) -> bool:
        if cik not in _xbrl_cache:
            return False
        fetched_at, _ = _xbrl_cache[cik]
        return datetime.now(timezone.utc) - fetched_at < self.cache_ttl

    def get_company_financials(self, cik: str, ticker: str = "") -> Optional[CompanyFinancials]:
        if self.is_cached(cik):
            _, raw = _xbrl_cache[cik]
            return self._build(cik, ticker, raw, from_cache=True)

        padded = cik.lstrip("0").zfill(10)
        url = f"{EDGAR_BASE_URL}/api/xbrl/companyfacts/CIK{padded}.json"

        try:
            r = httpx.get(url, headers=EDGAR_HEADERS, timeout=15, follow_redirects=True)
            if r.status_code == 404:
                _xbrl_cache[cik] = (datetime.now(timezone.utc), None)
                return None
            r.raise_for_status()
            raw = r.json()
        except Exception:
            return None

        _xbrl_cache[cik] = (datetime.now(timezone.utc), raw)
        return self._build(cik, ticker, raw, from_cache=False)

    def _build(self, cik: str, ticker: str, raw: Optional[dict], from_cache: bool) -> Optional[CompanyFinancials]:
        if raw is None:
            return None
        us_gaap = raw.get("facts", {}).get("us-gaap", {})
        if not us_gaap:
            return None

        f = CompanyFinancials(cik=cik, ticker=ticker, from_cache=from_cache)
        f.revenue = self._best(_REVENUE, us_gaap, "USD")
        f.net_income = self._best(_NET_INCOME, us_gaap, "USD")
        f.eps = self._best(_EPS, us_gaap, "USD/shares")
        f.total_assets = self._best(_ASSETS, us_gaap, "USD")
        f.total_liabilities = self._best(_LIABILITIES, us_gaap, "USD")
        return f

    def _best(self, concepts: list[str], us_gaap: dict, unit: str) -> Optional[FinancialMetric]:
        for concept in concepts:
            m = self._extract(us_gaap, concept, unit)
            if m is not None:
                return m
        return None

    def _extract(self, us_gaap: dict, concept: str, unit: str) -> Optional[FinancialMetric]:
        data = us_gaap.get(concept)
        if not data:
            return None
        entries = data.get("units", {}).get(unit, [])
        if not entries:
            return None

        for form in ("10-K", "10-Q"):
            candidates = [e for e in entries if e.get("form") == form and "end" in e and "val" in e]
            if candidates:
                latest = max(candidates, key=lambda e: e["end"])
                return FinancialMetric(
                    concept=concept,
                    value=float(latest["val"]),
                    unit=unit,
                    period=latest["end"],
                )
        return None
import math

import httpx

_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
}


class YahooFinanceClient:
    def get_price(self, ticker: str) -> float | None:
        try:
            response = httpx.get(
                _CHART_URL.format(ticker=ticker),
                params={"interval": "1d", "range": "5d"},
                headers=_HEADERS,
                timeout=10,
                follow_redirects=True,
            )
            response.raise_for_status()
            price = response.json()["chart"]["result"][0]["meta"]["regularMarketPrice"]
            if price is None or math.isnan(float(price)):
                return None
            return float(price)
        except Exception:
            return None
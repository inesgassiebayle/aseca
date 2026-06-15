import httpx
from sqlalchemy.orm import Session

from app.core.exceptions import WatchlistItemNotFoundError
from app.integrations.edgar import XbrlClient
from app.models.models import WatchlistItem
from app.services.edgar_service import EdgarService, TtlCache, TtlKeyedCache


class WatchlistCompareService:
    def __init__(self, db: Session):
        self.db = db
        self.xbrl_client = XbrlClient()
        self.edgar_service = EdgarService(
            http_client=httpx.Client(),
            cache=TtlCache(),
            filings_cache=TtlKeyedCache(),
            metrics_cache=TtlKeyedCache(),
        )

    def _assert_in_watchlist(self, user_id: int, ticker: str) -> WatchlistItem:
        item = self.db.query(WatchlistItem).filter(
            WatchlistItem.user_id == user_id,
            WatchlistItem.ticker == ticker.upper(),
        ).first()
        if not item:
            raise WatchlistItemNotFoundError(f"{ticker.upper()} no está en tu watchlist")
        return item

    def _get_cik(self, ticker: str) -> str:
        tickers_data = self.edgar_service._get_tickers()
        for entry in tickers_data.values():
            if entry["ticker"].upper() == ticker.upper():
                return str(entry["cik_str"]).zfill(10)
        return "0000000000"

    def _get_cik_int(self, ticker: str) -> int:
        return int(self._get_cik(ticker))

    def compare_metrics(self, user_id: int, tickers: list[str]) -> list[dict]:
        results = []
        for ticker in tickers:
            self._assert_in_watchlist(user_id, ticker)
            cik = self._get_cik(ticker)
            financials = self.xbrl_client.get_company_financials(cik, ticker)
            results.append({
                "ticker": ticker.upper(),
                "financials_available": financials is not None,
                "revenue": financials.revenue.value if financials and financials.revenue else None,
                "revenue_period": financials.revenue.period if financials and financials.revenue else None,
                "net_income": financials.net_income.value if financials and financials.net_income else None,
                "net_income_period": financials.net_income.period if financials and financials.net_income else None,
                "eps": financials.eps.value if financials and financials.eps else None,
                "eps_period": financials.eps.period if financials and financials.eps else None,
                "total_assets": financials.total_assets.value if financials and financials.total_assets else None,
                "total_assets_period": financials.total_assets.period if financials and financials.total_assets else None,
                "total_liabilities": financials.total_liabilities.value if financials and financials.total_liabilities else None,
                "total_liabilities_period": financials.total_liabilities.period if financials and financials.total_liabilities else None,
            })
        return results

    def compare_history(self, user_id: int, tickers: list[str], metric: str, quarters: int = 8) -> list[dict]:
        results = []
        for ticker in tickers:
            self._assert_in_watchlist(user_id, ticker)
            cik_int = self._get_cik_int(ticker)
            try:
                history = self.edgar_service.get_metric_history(cik=cik_int, metric=metric, quarters=quarters)
                data_points = history["data_points"]
            except ValueError:
                raise
            except Exception:
                data_points = []
            results.append({
                "ticker": ticker.upper(),
                "data_points": data_points,
                "quarters_available": len(data_points),
            })
        return results

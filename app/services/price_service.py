import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.integrations.yahoo_finance import YahooFinanceClient
from app.models.models import BatchRun, StockPrice

logger = logging.getLogger(__name__)


@dataclass
class BatchResult:
    updated: int
    failed: int
    ran_at: datetime
    failed_tickers: list[str] = field(default_factory=list)


class PriceService:
    def __init__(self, db: Session, yahoo_client: YahooFinanceClient, whitelist: list[str]):
        self.db = db
        self.yahoo_client = yahoo_client
        self.whitelist = whitelist

    def run_batch(self) -> BatchResult:
        updated = 0
        failed_tickers: list[str] = []
        now = datetime.now(timezone.utc)

        for ticker in self.whitelist:
            price = self.yahoo_client.get_price(ticker)
            if price is None:
                logger.warning("price fetch failed: %s", ticker)
                failed_tickers.append(ticker)
                continue

            existing = self.db.query(StockPrice).filter(StockPrice.ticker == ticker).first()
            if existing:
                existing.price = price
                existing.updated_at = now
            else:
                self.db.add(StockPrice(ticker=ticker, price=price, updated_at=now))
            updated += 1

        failed = len(failed_tickers)
        self.db.add(BatchRun(ran_at=now, updated_count=updated, failed_count=failed))
        self.db.commit()

        return BatchResult(updated=updated, failed=failed, ran_at=now, failed_tickers=failed_tickers)

    def get_last_update(self) -> datetime | None:
        run = self.db.query(BatchRun).order_by(BatchRun.ran_at.desc()).first()
        return run.ran_at if run else None

    def get_price(self, ticker: str) -> float | None:
        record = self.db.query(StockPrice).filter(StockPrice.ticker == ticker).first()
        return record.price if record else None
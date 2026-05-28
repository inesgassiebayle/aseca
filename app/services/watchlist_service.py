from sqlalchemy.orm import Session
from app.models.models import WatchlistItem
from app.core.exceptions import TickerAlreadyInWatchlistError, TickerNotInWatchlistError


class WatchlistService:

    def __init__(self, db: Session):
        self.db = db

    def add(self, user_id: int, ticker: str) -> WatchlistItem:
        ticker = ticker.upper()
        existing = self.db.query(WatchlistItem).filter(
            WatchlistItem.user_id == user_id,
            WatchlistItem.ticker == ticker,
            ).first()

        if existing:
            raise TickerAlreadyInWatchlistError(ticker)

        item = WatchlistItem(user_id=user_id, ticker=ticker)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def remove(self, user_id: int, ticker: str) -> None:
        ticker = ticker.upper()
        item = self.db.query(WatchlistItem).filter(
            WatchlistItem.user_id == user_id,
            WatchlistItem.ticker == ticker,
            ).first()

        if not item:
            raise TickerNotInWatchlistError(ticker)

        self.db.delete(item)
        self.db.commit()
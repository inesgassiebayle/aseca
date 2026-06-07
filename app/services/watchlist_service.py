from sqlalchemy.orm import Session
from app.models.models import WatchlistItem
from app.core.exceptions import TickerAlreadyInWatchlistError


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
            raise TickerAlreadyInWatchlistError(f"{ticker} ya está en la watchlist")

        item = WatchlistItem(user_id=user_id, ticker=ticker)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item
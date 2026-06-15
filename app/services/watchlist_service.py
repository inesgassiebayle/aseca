from sqlalchemy.orm import Session
from app.core.whitelist import TICKER_WHITELIST
from app.models.models import WatchlistItem
from app.core.exceptions import TickerAlreadyInWatchlistError, TickerNotInWhitelistError, WatchlistItemNotFoundError
from app.models.models import WatchlistItem, StockPrice

class WatchlistService:
    def __init__(self, db: Session):
        self.db = db

    def add(self, user_id: int, ticker: str) -> WatchlistItem:
        ticker = ticker.upper()

        if ticker not in TICKER_WHITELIST:
            raise TickerNotInWhitelistError(f"{ticker} no pertenece a la lista blanca")

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

    def get(self, user_id: int) -> list[WatchlistItem]:
        return self.db.query(WatchlistItem).filter(
            WatchlistItem.user_id == user_id
        ).all()

    def remove(self, user_id: int, ticker: str) -> None:
        ticker = ticker.upper()
        item = self.db.query(WatchlistItem).filter(
            WatchlistItem.user_id == user_id,
            WatchlistItem.ticker == ticker,
        ).first()

        if not item:
            raise WatchlistItemNotFoundError(f"{ticker} no está en tu watchlist")

        self.db.delete(item)
        self.db.commit()

    def get_with_prices(self, user_id: int) -> list[dict]:
        rows = (
            self.db.query(WatchlistItem, StockPrice)
            .outerjoin(StockPrice, WatchlistItem.ticker == StockPrice.ticker)
            .filter(WatchlistItem.user_id == user_id)
            .all()
        )
        return [
            {
                "id": item.id,
                "ticker": item.ticker,
                "price": stock.price if stock else None,
                "updated_at": stock.updated_at if stock else None,
            }
            for item, stock in rows
        ]
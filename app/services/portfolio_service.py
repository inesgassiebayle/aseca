from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.models import Operation, Position, StockPrice
from app.core.exceptions import TickerNotFoundError, InsufficientSharesError


class PortfolioService:
    def __init__(self, db: Session):
        self.db = db

    def buy(self, user_id: int, ticker: str, quantity: float) -> Operation:
        price_row = self.db.query(StockPrice).filter(StockPrice.ticker == ticker).first()
        if not price_row:
            raise TickerNotFoundError(f"No hay precio almacenado para {ticker}")

        operation = Operation(
            user_id=user_id,
            ticker=ticker,
            type="buy",
            quantity=quantity,
            price=price_row.price,
            executed_at=datetime.now(timezone.utc),
        )
        self.db.add(operation)

        position = self.db.query(Position).filter(
            Position.user_id == user_id,
            Position.ticker == ticker,
            ).first()

        if position:
            total_cost = position.avg_price * position.quantity + price_row.price * quantity
            position.quantity += quantity
            position.avg_price = total_cost / position.quantity
        else:
            position = Position(
                user_id=user_id,
                ticker=ticker,
                quantity=quantity,
                avg_price=price_row.price,
            )
            self.db.add(position)

        self.db.commit()
        self.db.refresh(operation)
        return operation

def sell(self, user_id: int, ticker: str, quantity: float) -> Operation:
    price_row = self.db.query(StockPrice).filter(StockPrice.ticker == ticker).first()
    if not price_row:
        raise TickerNotFoundError(f"No hay precio almacenado para {ticker}")

    position = self.db.query(Position).filter(
        Position.user_id == user_id,
        Position.ticker == ticker,
        ).first()

    if not position:
        raise InsufficientSharesError(f"No tenés posición en {ticker}")

    if quantity > position.quantity:
        raise InsufficientSharesError(f"Cantidad insuficiente para {ticker}")

    operation = Operation(
        user_id=user_id,
        ticker=ticker,
        type="sell",
        quantity=quantity,
        price=price_row.price,
        executed_at=datetime.now(timezone.utc),
    )
    self.db.add(operation)

    if position.quantity == quantity:
        self.db.delete(position)
    else:
        position.quantity -= quantity

    self.db.commit()
    self.db.refresh(operation)
    return operation
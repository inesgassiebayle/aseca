from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.dependencies import get_current_user
from app.core.exceptions import TickerNotFoundError, InsufficientSharesError, PositionNotFoundError
from app.db.session import get_db
from app.models.models import User, Position, StockPrice
from app.services.portfolio_service import PortfolioService

router = APIRouter()


class BuyRequest(BaseModel):
    ticker: str
    quantity: float


class SellRequest(BaseModel):
    ticker: str
    quantity: float


class OperationResponse(BaseModel):
    id: int
    ticker: str
    type: str
    quantity: float
    price: float
    executed_at: datetime

    model_config = {"from_attributes": True}


class PositionResponse(BaseModel):
    id: int
    ticker: str
    quantity: float
    historical_cost: float
    current_price: Optional[float] = None
    current_value: Optional[float] = None
    price_updated_at: Optional[datetime] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None

    model_config = {"from_attributes": True}


class OperationItemResponse(BaseModel):
    id: int
    ticker: str
    type: str
    quantity: float
    price: float
    executed_at: datetime

    model_config = {"from_attributes": True}


class PositionDetailResponse(BaseModel):
    ticker: str
    quantity: float
    avg_price: float
    current_price: Optional[float] = None
    pnl: Optional[float] = None
    operations: list[OperationItemResponse]


@router.post("/buy", response_model=OperationResponse, status_code=status.HTTP_201_CREATED)
def buy(
        body: BuyRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    try:
        return PortfolioService(db).buy(
            user_id=current_user.id,
            ticker=body.ticker,
            quantity=body.quantity,
        )
    except TickerNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.post("/sell", response_model=OperationResponse, status_code=status.HTTP_201_CREATED)
def sell(
        body: SellRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    try:
        return PortfolioService(db).sell(
            user_id=current_user.id,
            ticker=body.ticker,
            quantity=body.quantity,
        )
    except TickerNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except InsufficientSharesError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.get("/", response_model=list[PositionResponse])
def get_portfolio(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    return PortfolioService(db).get_portfolio(user_id=current_user.id)


@router.get("/{ticker}", response_model=PositionDetailResponse)
def get_position_detail(
        ticker: str,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    try:
        return PortfolioService(db).get_position_detail(
            user_id=current_user.id,
            ticker=ticker,
        )
    except PositionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
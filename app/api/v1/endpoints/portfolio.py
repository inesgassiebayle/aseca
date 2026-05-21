from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.dependencies import get_current_user
from app.core.exceptions import TickerNotFoundError
from app.db.session import get_db
from app.models.models import User, Position
from app.services.portfolio_service import PortfolioService

router = APIRouter()

class BuyRequest(BaseModel):
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
    avg_price: float

    model_config = {"from_attributes": True}

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

@router.get("/", response_model=list[PositionResponse])
def get_portfolio(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    positions = db.query(Position).filter(Position.user_id == current_user.id).all()
    return positions
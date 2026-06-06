from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.models import User, Operation

router = APIRouter()

class OperationResponse(BaseModel):
    id: int
    ticker: str
    type: str
    quantity: float
    price: float
    executed_at: datetime

    model_config = {"from_attributes": True}

from app.services.portfolio_service import PortfolioService

@router.get("/", response_model=list[OperationResponse])
def get_operations(
        ticker: Optional[str] = Query(None),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    return PortfolioService(db).get_operations(user_id=current_user.id, ticker=ticker)
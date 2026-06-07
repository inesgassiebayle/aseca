from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.models import User
from app.services.watchlist_service import WatchlistService
from app.core.exceptions import TickerAlreadyInWatchlistError

router = APIRouter()


def get_watchlist_service(db: Session = Depends(get_db)) -> WatchlistService:
    return WatchlistService(db)


class AddTickerRequest(BaseModel):
    ticker: str


class WatchlistItemResponse(BaseModel):
    id: int
    ticker: str

    class Config:
        from_attributes = True


@router.post("/", response_model=WatchlistItemResponse, status_code=201)
def add_to_watchlist(
    body: AddTickerRequest,
    current_user: User = Depends(get_current_user),
    service: WatchlistService = Depends(get_watchlist_service),
):
    try:
        return service.add(user_id=current_user.id, ticker=body.ticker)
    except TickerAlreadyInWatchlistError as e:
        raise HTTPException(status_code=409, detail=str(e))

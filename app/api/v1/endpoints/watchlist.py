from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.exceptions import TickerAlreadyInWatchlistError, TickerNotInWatchlistError
from app.db.session import get_db
from app.models.models import User
from app.services.watchlist_service import WatchlistService

router = APIRouter()


class AddToWatchlistRequest(BaseModel):
    ticker: str


class WatchlistItemResponse(BaseModel):
    id: int
    ticker: str

    model_config = {"from_attributes": True}


@router.post("/", response_model=WatchlistItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
        body: AddToWatchlistRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    try:
        return WatchlistService(db).add(user_id=current_user.id, ticker=body.ticker)
    except TickerAlreadyInWatchlistError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

@router.delete("/{ticker}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(
        ticker: str,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    try:
        WatchlistService(db).remove(user_id=current_user.id, ticker=ticker)
    except TickerNotInWatchlistError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
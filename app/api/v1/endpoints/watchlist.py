from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.whitelist import TICKER_WHITELIST

from app.core.dependencies import get_db, get_current_user
from app.models.models import User
from app.services.watchlist_service import WatchlistService
from app.core.exceptions import TickerAlreadyInWatchlistError, TickerNotInWhitelistError, WatchlistItemNotFoundError

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
    except TickerNotInWhitelistError as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.get("/", response_model=list[WatchlistItemResponse])
def get_watchlist(
    current_user: User = Depends(get_current_user),
    service: WatchlistService = Depends(get_watchlist_service),
):
    return service.get(user_id=current_user.id)

@router.delete("/{ticker}", status_code=200)
def remove_from_watchlist(
    ticker: str,
    current_user: User = Depends(get_current_user),
    service: WatchlistService = Depends(get_watchlist_service),
):
    try:
        service.remove(user_id=current_user.id, ticker=ticker)
        return {"message": f"{ticker.upper()} eliminado de tu watchlist"}
    except WatchlistItemNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/whitelist")
def get_whitelist():
    return TICKER_WHITELIST
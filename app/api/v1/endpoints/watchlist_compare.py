from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.core.exceptions import WatchlistItemNotFoundError
from app.models.models import User
from app.services.watchlist_compare_service import WatchlistCompareService

router = APIRouter()


def get_compare_service(db: Session = Depends(get_db)) -> WatchlistCompareService:
    return WatchlistCompareService(db)


class MetricCompareItem(BaseModel):
    ticker: str
    financials_available: bool
    revenue: Optional[float] = None
    revenue_period: Optional[str] = None
    net_income: Optional[float] = None
    net_income_period: Optional[str] = None
    eps: Optional[float] = None
    eps_period: Optional[str] = None
    total_assets: Optional[float] = None
    total_assets_period: Optional[str] = None
    total_liabilities: Optional[float] = None
    total_liabilities_period: Optional[str] = None


class HistoryDataPoint(BaseModel):
    period_end: str
    value: float
    form: str
    filed: str


class HistoryCompareItem(BaseModel):
    ticker: str
    data_points: list[HistoryDataPoint]
    quarters_available: int


@router.get("/compare", response_model=list[MetricCompareItem])
def compare_metrics(
    tickers: str = Query(..., description="Tickers separados por coma: AAPL,MSFT"),
    current_user: User = Depends(get_current_user),
    service: WatchlistCompareService = Depends(get_compare_service),
):
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if len(ticker_list) < 1:
        raise HTTPException(status_code=400, detail="Ingresá al menos un ticker")
    try:
        return service.compare_metrics(user_id=current_user.id, tickers=ticker_list)
    except WatchlistItemNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/compare/history", response_model=list[HistoryCompareItem])
def compare_history(
    tickers: str = Query(..., description="Tickers separados por coma: AAPL,GOOGL"),
    metric: str = Query(..., description="revenue | net_income | eps"),
    quarters: int = Query(default=8, ge=1, le=8),
    current_user: User = Depends(get_current_user),
    service: WatchlistCompareService = Depends(get_compare_service),
):
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if len(ticker_list) < 1:
        raise HTTPException(status_code=400, detail="Ingresá al menos un ticker")
    try:
        return service.compare_history(
            user_id=current_user.id,
            tickers=ticker_list,
            metric=metric,
            quarters=quarters,
        )
    except WatchlistItemNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

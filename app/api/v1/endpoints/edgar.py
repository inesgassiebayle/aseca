from datetime import datetime
from typing import Annotated, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.integrations.edgar import XbrlClient
from app.services.edgar_service import CompanyDetailService, EdgarService, TtlCache, TtlKeyedCache

router = APIRouter()

_edgar_cache   = TtlCache()
_filings_cache = TtlKeyedCache()
_metrics_cache = TtlKeyedCache()


def get_edgar_service():
    with httpx.Client() as client:
        yield EdgarService(
            client,
            cache=_edgar_cache,
            filings_cache=_filings_cache,
            metrics_cache=_metrics_cache,
        )


def get_company_detail_service(db: Session = Depends(get_db)) -> CompanyDetailService:
    return CompanyDetailService(db, XbrlClient())


class CompanyResult(BaseModel):
    name: str
    ticker: str
    cik: int

class CompanyDetail(BaseModel):
    ticker: str
    name: str
    cik: str
    price: Optional[float]
    updated_at: Optional[str]

class Filing(BaseModel):
    type: str
    date: str
    url: str

class FilingsResponse(BaseModel):
    filings: list[Filing]
    message: str | None = None

class MetricDataPoint(BaseModel):
    period_end: str
    value: float
    form: str
    filed: str

class MetricHistoryResponse(BaseModel):
    cik: int
    metric: str
    data_points: list[MetricDataPoint]
    cached: bool

class FinancialMetricOut(BaseModel):
    concept: str
    value: float
    unit: str
    period: str

class CompanyDetailOut(BaseModel):
    cik: str
    ticker: str
    price: Optional[float] = None
    price_last_updated: Optional[datetime] = None
    financials_available: bool
    from_cache: bool = False
    revenue: Optional[FinancialMetricOut] = None
    net_income: Optional[FinancialMetricOut] = None
    eps: Optional[FinancialMetricOut] = None
    total_assets: Optional[FinancialMetricOut] = None
    total_liabilities: Optional[FinancialMetricOut] = None


@router.get("/search", response_model=list[CompanyResult])
def search_companies(
        q: str = Query(..., description="Nombre parcial o ticker exacto de la empresa"),
        service: EdgarService = Depends(get_edgar_service),
):
    return service.search_companies(q)


@router.get("/company/{ticker}", response_model=CompanyDetail)
def get_company(
        ticker: str,
        service: EdgarService = Depends(get_edgar_service),
):
    company = service.get_company(ticker)
    if not company:
        raise HTTPException(status_code=404, detail=f"Empresa {ticker} no encontrada")
    return company


@router.get("/company/{cik}/financials", response_model=CompanyDetailOut)
def get_company_financials(
        cik: str,
        ticker: str = Query(default=""),
        service: CompanyDetailService = Depends(get_company_detail_service),
):
    result = service.get_company_detail(cik, ticker)
    out = CompanyDetailOut(
        cik=result.cik,
        ticker=result.ticker,
        price=result.price_info.price if result.price_info else None,
        price_last_updated=result.price_info.last_updated if result.price_info else None,
        financials_available=result.financials is not None,
        from_cache=result.financials.from_cache if result.financials else False,
    )
    if result.financials:
        f = result.financials
        if f.revenue:
            out.revenue = FinancialMetricOut(**vars(f.revenue))
        if f.net_income:
            out.net_income = FinancialMetricOut(**vars(f.net_income))
        if f.eps:
            out.eps = FinancialMetricOut(**vars(f.eps))
        if f.total_assets:
            out.total_assets = FinancialMetricOut(**vars(f.total_assets))
        if f.total_liabilities:
            out.total_liabilities = FinancialMetricOut(**vars(f.total_liabilities))
    return out


@router.get("/companies/{cik}/filings", response_model=FilingsResponse)
def get_filings(cik: int, service: EdgarService = Depends(get_edgar_service)):
    filings = service.get_filings(cik)
    message = "Esta empresa no tiene filings 10-K o 10-Q disponibles." if not filings else None
    return FilingsResponse(filings=filings, message=message)


@router.get("/companies/{cik}/metrics/{metric}", response_model=MetricHistoryResponse)
def get_metric_history(
        cik: int,
        metric: str,
        quarters: Annotated[int, Query(ge=1, le=8)] = 8,
        service: EdgarService = Depends(get_edgar_service),
):
    try:
        result = service.get_metric_history(cik=cik, metric=metric, quarters=quarters)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return MetricHistoryResponse(**result)
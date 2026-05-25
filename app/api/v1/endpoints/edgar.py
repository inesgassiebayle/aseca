from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.services.edgar_service import EdgarService, TtlCache, TtlKeyedCache

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



class CompanyResult(BaseModel):
    name: str
    ticker: str
    cik: int


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



@router.get("/search", response_model=list[CompanyResult])
def search_companies(
    q: str = Query(..., description="Nombre parcial o ticker exacto de la empresa"),
    service: EdgarService = Depends(get_edgar_service),
):
    return service.search_companies(q)


@router.get("/companies/{cik}/filings", response_model=FilingsResponse)
def get_filings(cik: int, service: EdgarService = Depends(get_edgar_service)):
    filings = service.get_filings(cik)
    message = "Esta empresa no tiene filings 10-K o 10-Q disponibles." if not filings else None
    return FilingsResponse(filings=filings, message=message)



@router.get(
    "/companies/{cik}/metrics/{metric}",
    response_model=MetricHistoryResponse,
)
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
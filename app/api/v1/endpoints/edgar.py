import httpx
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from app.services.edgar_service import EdgarService, TtlCache, TtlKeyedCache

router = APIRouter()

_edgar_cache = TtlCache()
_filings_cache = TtlKeyedCache()


def get_edgar_service():
    with httpx.Client() as client:
        yield EdgarService(client, cache=_edgar_cache, filings_cache=_filings_cache)


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

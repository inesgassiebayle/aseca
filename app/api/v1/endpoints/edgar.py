import httpx
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from app.services.edgar_service import EdgarService, TtlCache

router = APIRouter()

_edgar_cache = TtlCache()


def get_edgar_service():
    with httpx.Client() as client:
        yield EdgarService(client, cache=_edgar_cache)


class CompanyResult(BaseModel):
    name: str
    ticker: str
    cik: int


@router.get("/search", response_model=list[CompanyResult])
def search_companies(
    q: str = Query(..., description="Nombre parcial o ticker exacto de la empresa"),
    service: EdgarService = Depends(get_edgar_service),
):
    return service.search_companies(q)

from fastapi import HTTPException
from typing import Optional

class CompanyDetail(BaseModel):
    ticker: str
    name: str
    cik: str
    price: Optional[float]
    updated_at: Optional[str]

@router.get("/company/{ticker}", response_model=CompanyDetail)
def get_company(
        ticker: str,
        service: EdgarService = Depends(get_edgar_service),
):
    company = service.get_company(ticker)
    if not company:
        raise HTTPException(status_code=404, detail=f"Empresa {ticker} no encontrada")
    return company
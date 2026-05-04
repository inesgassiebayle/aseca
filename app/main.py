from fastapi import FastAPI
from app.api.v1.endpoints import auth, portfolio, operations, watchlist, edgar, prices
from app.core.config import settings

app = FastAPI(
    title="ASECA API",
    version="0.1.0",
    description="Portfolio tracker integrating SEC EDGAR and Yahoo Finance",
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(portfolio.router, prefix="/api/v1/portfolio", tags=["portfolio"])
app.include_router(operations.router, prefix="/api/v1/operations", tags=["operations"])
app.include_router(watchlist.router, prefix="/api/v1/watchlist", tags=["watchlist"])
app.include_router(edgar.router, prefix="/api/v1/edgar", tags=["edgar"])
app.include_router(prices.router, prefix="/api/v1/prices", tags=["prices"])


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.APP_VERSION}
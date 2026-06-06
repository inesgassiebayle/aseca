from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    portfolio = relationship("Position", back_populates="owner")
    watchlist = relationship("WatchlistItem", back_populates="owner")
    operations = relationship("Operation", back_populates="owner")


class Position(Base):
    __tablename__ = "positions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    avg_price = Column(Float, nullable=False)
    owner = relationship("User", back_populates="portfolio")


class Operation(Base):
    __tablename__ = "operations"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "buy" | "sell"
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    executed_at = Column(DateTime, nullable=False)
    owner = relationship("User", back_populates="operations")


class WatchlistItem(Base):
    __tablename__ = "watchlist"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String, nullable=False)
    owner = relationship("User", back_populates="watchlist")



class BatchRun(Base):
    __tablename__ = "batch_runs"
    id = Column(Integer, primary_key=True)
    ran_at = Column(DateTime, nullable=False)
    updated_count = Column(Integer, nullable=False)
    failed_count = Column(Integer, nullable=False)

class StockPrice(Base):
    __tablename__ = "stock_prices"

    id = Column(Integer, primary_key=True)
    ticker = Column(String, nullable=False, unique=True)
    price = Column(Float, nullable=False)
    updated_at = Column(DateTime, nullable=False)
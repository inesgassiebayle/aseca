from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.models.models import User
from app.core.config import settings
from app.core.exceptions import EmailAlreadyExistsError, WeakPasswordError, InvalidCredentialsError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MIN_PASSWORD_LENGTH = 8

class AuthService:

    def __init__(self, db: Session):
        self.db = db

    def register(self, email: str, password: str) -> dict:
        if len(password) < MIN_PASSWORD_LENGTH:
            raise WeakPasswordError()

        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            raise EmailAlreadyExistsError()

        hashed_password = pwd_context.hash(password)
        user = User(email=email, hashed_password=hashed_password)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        token = self._create_token(email)
        return {"access_token": token, "token_type": "bearer"}

    def login(self, email: str, password: str) -> dict:
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not pwd_context.verify(password, user.hashed_password):
            raise InvalidCredentialsError()

        token = self._create_token(email)
        return {"access_token": token, "token_type": "bearer"}

    def _create_token(self, email: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {"sub": email, "exp": expire}
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
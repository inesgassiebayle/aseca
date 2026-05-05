from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_VERSION: str = "0.1.0"
    DATABASE_URL: str = "sqlite:///./dev.db"
    SECRET_KEY: str = "changeme-in-production"
    EDGAR_USER_AGENT: str = "Aseca dev@aseca.com"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440


settings = Settings()
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[str(BASE_DIR / ".env"), str(ROOT_DIR / ".env"), ".env"],
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "pdfinity"
    APP_VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str = "sqlite:///./pdfusion.db"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "change-this-in-production-secret-key-12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # File Storage (default to local folder inside project)
    STORAGE_BACKEND: str = "local"
    UPLOAD_DIR: str = str(BASE_DIR / "storage" / "uploads")
    PROCESSED_DIR: str = str(BASE_DIR / "storage" / "processed")
    FILE_EXPIRY_HOURS: int = 24
    MAX_FILE_SIZE_MB: int = 100

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # AI
    AI_PROVIDER: str = "openai"
    OPENAI_API_KEY: str = ""

    # Cloud storage (optional)
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_URL: str = ""


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

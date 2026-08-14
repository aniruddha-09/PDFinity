from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import logging

from app.core.config import settings
from app.database.base import Base

logger = logging.getLogger(__name__)

# Engine configuration with sqlite thread check support
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Ensure tables are created
try:
    import app.models.user  # noqa
    import app.models.file  # noqa
    import app.models.job   # noqa
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.warning(f"Could not auto-create tables on startup: {e}")


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

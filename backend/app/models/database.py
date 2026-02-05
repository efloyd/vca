from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from backend.app.config import settings


class Base(DeclarativeBase):
    pass


# Lazy initialization
_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        # Ensure data directory exists
        settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
        _engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False},
        )
    return _engine


def get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal


def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=get_engine())

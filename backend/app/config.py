import os
from pydantic_settings import BaseSettings
from pathlib import Path

# Base directory for data (use /app/data in container, ./data locally)
_in_railway = bool(os.getenv("RAILWAY_ENVIRONMENT", ""))
BASE_DIR = Path("/app") if _in_railway else Path.cwd()
DATA_DIR = BASE_DIR / "data"


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    ADMIN_API_KEY: str
    OPENAI_CHAT_MODEL: str = "gpt-4"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    RETRIEVAL_TOP_K: int = 5
    SIMILARITY_THRESHOLD: float = 0.4

    DATA_DIR: Path = DATA_DIR
    CHROMA_DIR: Path = DATA_DIR / "chroma"
    UPLOADS_DIR: Path = DATA_DIR / "uploads"
    DATABASE_URL: str = f"sqlite:///{DATA_DIR}/vca.db"

    MAX_FILE_SIZE_MB: int = 50

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

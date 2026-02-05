from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    ADMIN_API_KEY: str
    OPENAI_CHAT_MODEL: str = "gpt-4"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    RETRIEVAL_TOP_K: int = 5
    SIMILARITY_THRESHOLD: float = 0.7

    DATA_DIR: Path = Path("data")
    CHROMA_DIR: Path = Path("data/chroma")
    UPLOADS_DIR: Path = Path("data/uploads")
    DATABASE_URL: str = "sqlite:///data/vca.db"

    MAX_FILE_SIZE_MB: int = 50

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

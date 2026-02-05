from backend.app.models.database import get_db
from backend.app.services.vectorstore_service import VectorStoreService

_vectorstore_service: VectorStoreService | None = None


def get_vectorstore_service() -> VectorStoreService:
    global _vectorstore_service
    if _vectorstore_service is None:
        _vectorstore_service = VectorStoreService()
    return _vectorstore_service

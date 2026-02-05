from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.database import get_db
from backend.app.models.document import Document
from backend.app.models.schemas import HealthResponse
from backend.app.dependencies import get_vectorstore_service
from backend.app.services.vectorstore_service import VectorStoreService

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(
    db: Session = Depends(get_db),
    vectorstore: VectorStoreService = Depends(get_vectorstore_service),
):
    doc_count = db.query(func.count(Document.id)).filter(Document.status == "ready").scalar() or 0
    chunk_count = vectorstore.get_chunk_count()
    return HealthResponse(
        status="healthy",
        document_count=doc_count,
        chunk_count=chunk_count,
    )

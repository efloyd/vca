import asyncio
import logging
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.core.auth import verify_admin
from backend.app.models.database import get_db, get_session_local
from backend.app.models.document import Document
from backend.app.models.schemas import DocumentResponse, DocumentListResponse, WebResourceRequest
from backend.app.dependencies import get_vectorstore_service
from backend.app.services.vectorstore_service import VectorStoreService
from backend.app.services.document_service import DocumentService
from backend.app.services.web_document_service import WebDocumentService
from backend.app.services.llm_service import get_llm_service
from backend.app.utils.file_utils import (
    is_supported_file,
    generate_storage_filename,
    get_upload_path,
    cleanup_file,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents")


async def _process_in_background(document_id: int, file_path, vectorstore, llm):
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        service = DocumentService(vectorstore, llm)
        await service.process_document(db, document_id, file_path)
    finally:
        db.close()


async def _process_web_in_background(document_id: int, url: str, include_children: bool, vectorstore, llm):
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        service = WebDocumentService(vectorstore, llm)
        await service.process_web_resource(db, document_id, url, include_children)
    finally:
        db.close()


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin: str = Depends(verify_admin),
    vectorstore: VectorStoreService = Depends(get_vectorstore_service),
):
    if not file.filename or not is_supported_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported: .pdf, .docx, .txt, .csv, .md, .html",
        )

    # Read file content
    content = await file.read()
    file_size = len(content)

    if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB}MB",
        )

    # Save to disk
    storage_filename = generate_storage_filename(file.filename)
    file_path = get_upload_path(storage_filename)
    file_path.write_bytes(content)

    # Create DB record
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    doc = Document(
        filename=storage_filename,
        original_filename=file.filename,
        file_type=ext,
        file_size=file_size,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Process in background
    llm = get_llm_service()
    asyncio.create_task(_process_in_background(doc.id, file_path, vectorstore, llm))

    return doc


@router.post("/web", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def add_web_resource(
    request: WebResourceRequest,
    db: Session = Depends(get_db),
    _admin: str = Depends(verify_admin),
    vectorstore: VectorStoreService = Depends(get_vectorstore_service),
):
    """Add a web page (and optionally its child pages) as a RAG resource."""
    # Validate URL
    parsed = urlparse(request.url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL. Must start with http:// or https://",
        )

    # Create a display name from the URL
    domain = parsed.netloc
    path = parsed.path.rstrip("/") or "/"
    display_name = f"{domain}{path}"

    # Create DB record
    doc = Document(
        filename="",  # No file for web resources
        original_filename=display_name,
        file_type="web",
        file_size=0,  # Will be updated after crawling
        status="processing",
        source_type="web",
        source_url=request.url,
        include_child_pages=request.include_child_pages,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Process in background
    llm = get_llm_service()
    asyncio.create_task(
        _process_web_in_background(
            doc.id, request.url, request.include_child_pages, vectorstore, llm
        )
    )

    return doc


@router.get("", response_model=DocumentListResponse)
def list_documents(
    db: Session = Depends(get_db),
    _admin: str = Depends(verify_admin),
):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return DocumentListResponse(documents=docs, total=len(docs))


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(verify_admin),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(verify_admin),
    vectorstore: VectorStoreService = Depends(get_vectorstore_service),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete vectors
    vectorstore.delete_document_chunks(document_id)

    # Delete file (only for file-based documents)
    if doc.source_type == "file" and doc.filename:
        file_path = get_upload_path(doc.filename)
        cleanup_file(file_path)

    # Delete DB record
    db.delete(doc)
    db.commit()


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
async def reprocess_document(
    document_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(verify_admin),
    vectorstore: VectorStoreService = Depends(get_vectorstore_service),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete old vectors
    vectorstore.delete_document_chunks(document_id)

    # Reset status
    doc.status = "processing"
    doc.error_message = None
    doc.chunk_count = 0
    db.commit()
    db.refresh(doc)

    llm = get_llm_service()

    if doc.source_type == "web":
        # Reprocess web resource
        asyncio.create_task(
            _process_web_in_background(
                doc.id, doc.source_url, doc.include_child_pages, vectorstore, llm
            )
        )
    else:
        # Reprocess file
        file_path = get_upload_path(doc.filename)
        if not file_path.exists():
            raise HTTPException(status_code=400, detail="Source file no longer exists")
        asyncio.create_task(_process_in_background(doc.id, file_path, vectorstore, llm))

    return doc

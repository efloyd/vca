from pydantic import BaseModel, HttpUrl
from datetime import datetime


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class SourceReference(BaseModel):
    document_name: str
    chunk_text: str
    relevance_score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceReference]


class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    chunk_count: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    source_type: str = "file"
    source_url: str | None = None
    include_child_pages: bool = False
    pages_crawled: int = 0

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int


class WebResourceRequest(BaseModel):
    url: str
    include_child_pages: bool = False


class HealthResponse(BaseModel):
    status: str
    document_count: int
    chunk_count: int

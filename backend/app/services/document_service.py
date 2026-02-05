import logging
from pathlib import Path

from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    CSVLoader,
    UnstructuredMarkdownLoader,
    UnstructuredHTMLLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.document import Document
from backend.app.services.vectorstore_service import VectorStoreService
from backend.app.services.llm_service import LLMService
from backend.app.utils.file_utils import get_file_extension

logger = logging.getLogger(__name__)

LOADER_MAP = {
    ".pdf": PyPDFLoader,
    ".docx": Docx2txtLoader,
    ".txt": TextLoader,
    ".csv": CSVLoader,
    ".md": UnstructuredMarkdownLoader,
    ".html": UnstructuredHTMLLoader,
}


class DocumentService:
    def __init__(self, vectorstore: VectorStoreService, llm: LLMService):
        self._vectorstore = vectorstore
        self._llm = llm
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
        )

    def _load_file(self, file_path: Path) -> list:
        ext = get_file_extension(str(file_path))
        loader_cls = LOADER_MAP.get(ext)
        if loader_cls is None:
            raise ValueError(f"Unsupported file type: {ext}")
        loader = loader_cls(str(file_path))
        return loader.load()

    async def process_document(self, db: Session, document_id: int, file_path: Path) -> None:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found in database")
            return

        try:
            # Load document
            raw_docs = self._load_file(file_path)
            if not raw_docs:
                raise ValueError("No content extracted from file")

            # Chunk
            chunks = self._splitter.split_documents(raw_docs)
            chunk_texts = [chunk.page_content for chunk in chunks]

            if not chunk_texts:
                raise ValueError("No chunks produced from document")

            # Embed (batch)
            embeddings = await self._llm.get_embeddings(chunk_texts)

            # Store in vector DB
            metadatas = [
                {
                    "document_id": document_id,
                    "document_name": doc.original_filename,
                    "chunk_index": i,
                }
                for i in range(len(chunk_texts))
            ]
            self._vectorstore.add_chunks(document_id, chunk_texts, embeddings, metadatas)

            # Update document status
            doc.status = "ready"
            doc.chunk_count = len(chunk_texts)
            db.commit()
            logger.info(f"Document {document_id} processed: {len(chunk_texts)} chunks")

        except Exception as e:
            logger.error(f"Error processing document {document_id}: {e}")
            doc.status = "error"
            doc.error_message = str(e)
            db.commit()

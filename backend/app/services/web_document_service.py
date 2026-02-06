import logging
from urllib.parse import urlparse

from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.document import Document
from backend.app.services.vectorstore_service import VectorStoreService
from backend.app.services.llm_service import LLMService
from backend.app.services.web_scraper_service import WebScraperService

logger = logging.getLogger(__name__)


class WebDocumentService:
    def __init__(self, vectorstore: VectorStoreService, llm: LLMService):
        self._vectorstore = vectorstore
        self._llm = llm
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
        )

    async def process_web_resource(
        self,
        db: Session,
        document_id: int,
        url: str,
        include_children: bool,
    ) -> None:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found in database")
            return

        scraper = WebScraperService()

        try:
            # Crawl the URL(s)
            pages = await scraper.crawl(url, include_children)

            if not pages:
                raise ValueError("No content could be extracted from the URL")

            doc.pages_crawled = len(pages)

            # Combine all page content
            all_chunks = []
            all_metadatas = []

            for page in pages:
                # Create chunks from this page
                chunks = self._splitter.split_text(page.text)

                for i, chunk in enumerate(chunks):
                    all_chunks.append(chunk)
                    all_metadatas.append({
                        "document_id": document_id,
                        "document_name": doc.original_filename,
                        "source_url": page.url,
                        "page_title": page.title,
                        "chunk_index": i,
                    })

            if not all_chunks:
                raise ValueError("No text chunks produced from web content")

            # Embed all chunks
            embeddings = await self._llm.get_embeddings(all_chunks)

            # Store in vector DB
            self._vectorstore.add_chunks(
                document_id,
                all_chunks,
                embeddings,
                all_metadatas,
            )

            # Update document status
            doc.status = "ready"
            doc.chunk_count = len(all_chunks)
            doc.file_size = sum(len(page.text) for page in pages)
            db.commit()

            logger.info(
                f"Web resource {document_id} processed: {len(pages)} pages, {len(all_chunks)} chunks"
            )

        except Exception as e:
            logger.error(f"Error processing web resource {document_id}: {e}")
            doc.status = "error"
            doc.error_message = str(e)
            db.commit()

        finally:
            await scraper.close()

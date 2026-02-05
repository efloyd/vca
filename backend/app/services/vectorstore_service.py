import chromadb
import logging
from chromadb.config import Settings as ChromaSettings

from backend.app.config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    def __init__(self):
        settings.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        self._client = chromadb.PersistentClient(
            path=str(settings.CHROMA_DIR),
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._collection = self._client.get_or_create_collection(
            name="vca_documents",
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(
        self,
        document_id: int,
        chunks: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
    ) -> int:
        ids = [f"doc{document_id}_chunk{i}" for i in range(len(chunks))]
        self._collection.add(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        return len(chunks)

    def query(
        self,
        query_embedding: list[float],
        top_k: int | None = None,
    ) -> dict:
        k = top_k or settings.RETRIEVAL_TOP_K
        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            include=["documents", "metadatas", "distances"],
        )
        return results

    def delete_document_chunks(self, document_id: int) -> None:
        try:
            existing = self._collection.get(
                where={"document_id": document_id},
            )
            if existing["ids"]:
                self._collection.delete(ids=existing["ids"])
        except Exception as e:
            logger.warning(f"Error deleting chunks for document {document_id}: {e}")

    def get_chunk_count(self) -> int:
        return self._collection.count()

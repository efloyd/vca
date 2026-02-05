import logging
from collections.abc import AsyncGenerator

from backend.app.config import settings
from backend.app.core.prompts import SYSTEM_PROMPT, NO_CONTEXT_RESPONSE
from backend.app.models.schemas import SourceReference
from backend.app.services.vectorstore_service import VectorStoreService
from backend.app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class RAGService:
    def __init__(self, vectorstore: VectorStoreService, llm: LLMService):
        self._vectorstore = vectorstore
        self._llm = llm

    async def query(
        self, user_message: str
    ) -> tuple[AsyncGenerator[str, None] | None, list[SourceReference]]:
        # Embed the query
        query_embedding = await self._llm.get_embedding(user_message)

        # Retrieve relevant chunks
        results = self._vectorstore.query(query_embedding)

        # Filter by similarity threshold (ChromaDB returns distances for cosine; lower = more similar)
        sources: list[SourceReference] = []
        context_parts: list[str] = []

        if results["documents"] and results["documents"][0]:
            for i, (doc, metadata, distance) in enumerate(
                zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0],
                )
            ):
                # Cosine distance: 0 = identical, 2 = opposite
                # Convert to similarity: 1 - distance
                similarity = 1 - distance
                if similarity >= settings.SIMILARITY_THRESHOLD:
                    context_parts.append(
                        f"[Source: {metadata.get('document_name', 'Unknown')}]\n{doc}"
                    )
                    sources.append(
                        SourceReference(
                            document_name=metadata.get("document_name", "Unknown"),
                            chunk_text=doc[:300],
                            relevance_score=round(similarity, 3),
                        )
                    )

        # If no relevant context found, return canned response
        if not context_parts:
            async def no_context_stream():
                yield NO_CONTEXT_RESPONSE

            return no_context_stream(), []

        # Build prompt with context
        context = "\n\n---\n\n".join(context_parts)
        system_prompt = SYSTEM_PROMPT.format(context=context)

        # Stream response
        stream = self._llm.stream_chat(system_prompt, user_message)
        return stream, sources

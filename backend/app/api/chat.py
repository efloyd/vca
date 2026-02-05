import json
import logging

from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse

from backend.app.models.schemas import ChatRequest
from backend.app.dependencies import get_vectorstore_service
from backend.app.services.vectorstore_service import VectorStoreService
from backend.app.services.llm_service import get_llm_service, LLMService
from backend.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat")
async def chat(
    request: ChatRequest,
    vectorstore: VectorStoreService = Depends(get_vectorstore_service),
):
    llm = get_llm_service()
    rag = RAGService(vectorstore, llm)

    async def event_stream():
        try:
            stream, sources = await rag.query(request.message)

            async for token in stream:
                yield {"data": json.dumps({"type": "token", "content": token})}

            if sources:
                yield {
                    "data": json.dumps(
                        {
                            "type": "sources",
                            "sources": [s.model_dump() for s in sources],
                        }
                    )
                }

            yield {"data": json.dumps({"type": "done"})}

        except Exception as e:
            logger.error(f"Chat error: {e}", exc_info=True)
            yield {"data": json.dumps({"type": "error", "message": str(e)})}

    return EventSourceResponse(event_stream())

import logging
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from backend.app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def get_embedding(self, text: str) -> list[float]:
        response = await self._client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=text,
        )
        return response.data[0].embedding

    async def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        response = await self._client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=texts,
        )
        return [item.embedding for item in response.data]

    async def stream_chat(
        self,
        system_prompt: str,
        user_message: str,
    ) -> AsyncGenerator[str, None]:
        stream = await self._client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service

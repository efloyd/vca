from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class DocumentProcessingError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class VectorStoreError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )

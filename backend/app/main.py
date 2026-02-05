import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.api.router import api_router
from backend.app.models.database import init_db
from backend.app.config import settings
from backend.app.core.exceptions import http_exception_handler, general_exception_handler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Virtual Compliance Assistant",
    description="RAG-powered chatbot for financial compliance",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# API routes
app.include_router(api_router)

# Ensure data directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Serve React static build in production
STATIC_DIR = Path(__file__).parent.parent.parent / "frontend" / "dist"

if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Serve index.html for all non-API routes (SPA catch-all)
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")


@app.on_event("startup")
async def startup_event():
    logger.info("Starting Virtual Compliance Assistant...")
    init_db()
    logger.info("Database initialized")
    logger.info(f"Data directory: {settings.DATA_DIR.absolute()}")

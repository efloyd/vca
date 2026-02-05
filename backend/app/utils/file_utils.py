import os
import uuid
from pathlib import Path

from backend.app.config import settings

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".csv", ".md", ".html"}


def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def is_supported_file(filename: str) -> bool:
    return get_file_extension(filename) in SUPPORTED_EXTENSIONS


def generate_storage_filename(original_filename: str) -> str:
    ext = get_file_extension(original_filename)
    return f"{uuid.uuid4().hex}{ext}"


def get_upload_path(storage_filename: str) -> Path:
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    return settings.UPLOADS_DIR / storage_filename


def cleanup_file(file_path: Path) -> None:
    try:
        if file_path.exists():
            os.remove(file_path)
    except OSError:
        pass

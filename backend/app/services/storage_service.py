import os
import uuid
import shutil
import aiofiles
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

from app.core.config import settings


class LocalStorageService:
    """Handles local file storage for uploads and processed files."""

    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.processed_dir = Path(settings.PROCESSED_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    def get_upload_path(self, file_id: str, filename: str) -> Path:
        """Generate a safe storage path for an uploaded file."""
        ext = Path(filename).suffix.lower()
        return self.upload_dir / f"{file_id}{ext}"

    def get_processed_path(self, job_id: str, filename: str) -> Path:
        """Generate a safe storage path for a processed output file."""
        ext = Path(filename).suffix.lower()
        return self.processed_dir / f"{job_id}_{filename}"

    async def save_upload(self, file_content: bytes, file_id: str, original_filename: str) -> str:
        """Save uploaded file bytes to disk. Returns the storage path string."""
        storage_path = self.get_upload_path(file_id, original_filename)
        async with aiofiles.open(storage_path, "wb") as f:
            await f.write(file_content)
        return str(storage_path)

    def delete_file(self, storage_path: str) -> bool:
        """Delete a file from disk. Returns True if deleted, False if not found."""
        path = Path(storage_path)
        if path.exists():
            path.unlink()
            return True
        return False

    def get_file_url(self, file_id: str, filename: str) -> str:
        """Return a download URL for the given file."""
        return f"/api/files/{file_id}/download"

    def get_expiry_time(self) -> datetime:
        """Return the expiry datetime for newly uploaded files."""
        return datetime.now(timezone.utc) + timedelta(hours=settings.FILE_EXPIRY_HOURS)


# Global singleton
storage = LocalStorageService()

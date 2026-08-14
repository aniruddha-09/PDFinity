import uuid
import mimetypes
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.file import File as FileModel
from app.models.user import User
from app.schemas.file import FileResponse
from app.core.security import get_current_user, get_optional_user
from app.services.storage_service import storage
from app.core.config import settings

router = APIRouter(prefix="/api/files", tags=["files"])

# Allowed MIME types
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

MAX_FILE_SIZE = settings.MAX_FILE_SIZE_MB * 1024 * 1024  # bytes


@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Upload a file (PDF or image). Returns a file record with a UUID."""
    # Read content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB} MB.",
        )

    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(file.filename or "")
    if not mime_type:
        # fallback: use the content-type from the upload
        mime_type = file.content_type or "application/octet-stream"

    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{mime_type}' is not supported. Please upload a PDF or image file.",
        )

    # Generate file record
    file_id = str(uuid.uuid4())
    safe_filename = Path(file.filename or "upload").name  # strip any path traversal

    # Save to storage
    storage_path = await storage.save_upload(content, file_id, safe_filename)

    # Persist to database
    db_file = FileModel(
        id=file_id,
        user_id=current_user.id if current_user else None,
        original_filename=safe_filename,
        storage_path=storage_path,
        file_size=len(content),
        mime_type=mime_type,
        expires_at=storage.get_expiry_time(),
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return db_file


@router.get("/{file_id}", response_model=FileResponse)
def get_file_info(file_id: str, db: Session = Depends(get_db)):
    """Get metadata for a specific file."""
    db_file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")
    return db_file


@router.get("/{file_id}/download")
def download_file(file_id: str, db: Session = Depends(get_db)):
    """Download a file by its UUID."""
    db_file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    file_path = Path(db_file.storage_path)
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File has been deleted or expired.")

    return FastAPIFileResponse(
        path=str(file_path),
        filename=db_file.original_filename,
        media_type=db_file.mime_type,
    )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a file (authenticated users only, own files only)."""
    db_file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")
    if db_file.user_id and db_file.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    storage.delete_file(db_file.storage_path)
    db.delete(db_file)
    db.commit()

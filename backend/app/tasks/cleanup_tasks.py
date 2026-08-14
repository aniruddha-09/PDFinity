"""Periodic Celery task that removes expired files from disk and database."""
import logging
from datetime import datetime, timezone
from pathlib import Path

from app.workers.celery_app import celery_app
from app.database.session import SessionLocal
from app.models.file import File as FileModel

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.cleanup_tasks.cleanup_expired_files")
def cleanup_expired_files():
    """Delete files that have passed their expiry datetime."""
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    deleted_count = 0
    try:
        expired_files = (
            db.query(FileModel)
            .filter(FileModel.expires_at != None, FileModel.expires_at < now)
            .all()
        )
        for f in expired_files:
            path = Path(f.storage_path)
            if path.exists():
                path.unlink()
            db.delete(f)
            deleted_count += 1

        db.commit()
        logger.info(f"Cleanup: deleted {deleted_count} expired files.")
    except Exception as e:
        logger.error(f"Cleanup task failed: {e}")
        db.rollback()
    finally:
        db.close()

    return {"deleted": deleted_count}

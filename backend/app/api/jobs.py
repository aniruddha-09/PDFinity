import uuid
from typing import List, Optional
import importlib
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.job import ProcessingJob, JobStatus, JobOperation
from app.models.file import File as FileModel
from app.schemas.job import JobCreate, JobResponse
from app.core.security import get_current_user, get_optional_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

# Task dispatcher map
TASK_MAP = {
    JobOperation.merge: "app.tasks.pdf_tasks.merge_pdf",
    JobOperation.split: "app.tasks.pdf_tasks.split_pdf",
    JobOperation.compress: "app.tasks.pdf_tasks.compress_pdf",
    JobOperation.rotate: "app.tasks.pdf_tasks.rotate_pdf",
    JobOperation.organize: "app.tasks.pdf_tasks.organize_pdf",
    JobOperation.watermark: "app.tasks.pdf_tasks.watermark_pdf",
    JobOperation.page_numbers: "app.tasks.pdf_tasks.add_page_numbers",
    JobOperation.images_to_pdf: "app.tasks.pdf_tasks.images_to_pdf",
    JobOperation.pdf_to_images: "app.tasks.pdf_tasks.pdf_to_images",
    JobOperation.ocr: "app.tasks.pdf_tasks.ocr_pdf",
    JobOperation.summarize: "app.tasks.pdf_tasks.summarize_pdf",
}


def _build_job_response(job: ProcessingJob, db: Session) -> JobResponse:
    output_url = None
    if job.output_file_id:
        output_url = f"/api/files/{job.output_file_id}/download"
    return JobResponse(
        id=job.id,
        operation=job.operation,
        status=job.status,
        progress=job.progress,
        input_file_ids=job.input_file_ids or [],
        output_file_id=job.output_file_id,
        error_message=job.error_message,
        created_at=job.created_at,
        completed_at=job.completed_at,
        output_url=output_url,
    )


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Create a processing job and dispatch it to Celery."""
    # Validate files exist
    files = db.query(FileModel).filter(FileModel.id.in_(payload.input_file_ids)).all()
    if len(files) != len(payload.input_file_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more files not found.")

    job = ProcessingJob(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        operation=payload.operation,
        status=JobStatus.queued,
        input_file_ids=payload.input_file_ids,
        options=payload.options,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Dispatch to Celery with local fallback
    task_name = TASK_MAP.get(payload.operation)
    if task_name:
        try:
            from app.workers.celery_app import celery_app as _celery
            task = _celery.send_task(task_name, args=[job.id])
            job.celery_task_id = task.id
            db.commit()
        except Exception as e:
            logger.info(f"Celery offline ({e}), executing {task_name} directly.")
            try:
                mod_name, func_name = task_name.rsplit(".", 1)
                mod = importlib.import_module(mod_name)
                func = getattr(mod, func_name)
                func(job.id)
                db.refresh(job)
            except Exception as exec_err:
                logger.error(f"Direct execution failed: {exec_err}")
                job.status = JobStatus.failed
                job.error_message = str(exec_err)[:500]
                db.commit()

    return _build_job_response(job, db)


@router.get("", response_model=List[JobResponse])
def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all jobs for the authenticated user."""
    jobs = (
        db.query(ProcessingJob)
        .filter(ProcessingJob.user_id == current_user.id)
        .order_by(ProcessingJob.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_build_job_response(j, db) for j in jobs]


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Get the status of a specific job."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    if job.user_id and (not current_user or job.user_id != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
    return _build_job_response(job, db)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a job record (authenticated users, own jobs only)."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    if job.user_id and job.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
    db.delete(job)
    db.commit()

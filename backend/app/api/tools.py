"""
Convenience tool-specific endpoints that bundle file upload + job creation.
Each POST /api/tools/<tool> accepts multipart form data (files + options)
and returns a job response immediately.
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import importlib
import logging

from app.database.session import get_db
from app.models.job import ProcessingJob, JobStatus, JobOperation
from app.models.file import File as FileModel
from app.models.user import User
from app.schemas.job import JobResponse
from app.core.security import get_optional_user
from app.services.storage_service import storage
from app.api.jobs import _build_job_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tools", tags=["tools"])


async def _upload_and_create_job(
    files: List[UploadFile],
    operation: JobOperation,
    options: dict,
    db: Session,
    current_user: Optional[User],
) -> ProcessingJob:
    """Helper: upload files and create a job record."""
    file_ids = []
    for upload in files:
        content = await upload.read()
        file_id = str(uuid.uuid4())
        import mimetypes
        mime_type, _ = mimetypes.guess_type(upload.filename or "")
        if not mime_type:
            mime_type = upload.content_type or "application/octet-stream"
        storage_path = await storage.save_upload(content, file_id, upload.filename or "upload.pdf")
        db_file = FileModel(
            id=file_id,
            user_id=current_user.id if current_user else None,
            original_filename=upload.filename or "upload.pdf",
            storage_path=storage_path,
            file_size=len(content),
            mime_type=mime_type,
            expires_at=storage.get_expiry_time(),
        )
        db.add(db_file)
        file_ids.append(file_id)

    db.flush()

    job = ProcessingJob(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        operation=operation,
        status=JobStatus.queued,
        input_file_ids=file_ids,
        options=options,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def _dispatch(job: ProcessingJob, task_name: str, db: Session):
    """Dispatch task to Celery queue, or fallback to local execution if Redis/Celery is offline."""
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
            logger.error(f"Direct execution failed for job {job.id}: {exec_err}")
            try:
                db.refresh(job)
                job.status = JobStatus.failed
                job.error_message = str(exec_err)[:500]
                db.commit()
            except Exception:
                pass  # DB already updated by the task itself


@router.post("/merge", response_model=JobResponse, status_code=201)
async def tool_merge(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    job = await _upload_and_create_job(files, JobOperation.merge, {}, db, current_user)
    _dispatch(job, "app.tasks.pdf_tasks.merge_pdf", db)
    return _build_job_response(job, db)


@router.post("/split", response_model=JobResponse, status_code=201)
async def tool_split(
    file: UploadFile = File(...),
    ranges: str = Form(""),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    parsed_ranges = [r.strip() for r in ranges.split(",") if r.strip()] if ranges else []
    job = await _upload_and_create_job([file], JobOperation.split, {"ranges": parsed_ranges}, db, current_user)
    _dispatch(job, "app.tasks.pdf_tasks.split_pdf", db)
    return _build_job_response(job, db)


@router.post("/compress", response_model=JobResponse, status_code=201)
async def tool_compress(
    file: UploadFile = File(...),
    quality: str = Form("recommended"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    job = await _upload_and_create_job([file], JobOperation.compress, {"quality": quality}, db, current_user)
    _dispatch(job, "app.tasks.pdf_tasks.compress_pdf", db)
    return _build_job_response(job, db)


@router.post("/rotate", response_model=JobResponse, status_code=201)
async def tool_rotate(
    file: UploadFile = File(...),
    angle: int = Form(90),
    pages: str = Form("all"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    job = await _upload_and_create_job([file], JobOperation.rotate, {"angle": angle, "pages": pages}, db, current_user)
    _dispatch(job, "app.tasks.pdf_tasks.rotate_pdf", db)
    return _build_job_response(job, db)


@router.post("/organize", response_model=JobResponse, status_code=201)
async def tool_organize(
    file: UploadFile = File(...),
    page_order: str = Form(""),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    import json
    order = json.loads(page_order) if page_order else []
    job = await _upload_and_create_job([file], JobOperation.organize, {"page_order": order}, db, current_user)
    _dispatch(job, "app.tasks.pdf_tasks.organize_pdf", db)
    return _build_job_response(job, db)


@router.post("/watermark", response_model=JobResponse, status_code=201)
async def tool_watermark(
    file: UploadFile = File(...),
    text: str = Form("CONFIDENTIAL"),
    font_size: int = Form(48),
    opacity: float = Form(0.3),
    angle: int = Form(45),
    position: str = Form("center"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    opts = {"text": text, "font_size": font_size, "opacity": opacity, "angle": angle, "position": position}
    job = await _upload_and_create_job([file], JobOperation.watermark, opts, db, current_user)
    _dispatch(job, "app.tasks.pdf_tasks.watermark_pdf", db)
    return _build_job_response(job, db)


@router.post("/page-numbers", response_model=JobResponse, status_code=201)
async def tool_page_numbers(
    file: UploadFile = File(...),
    position: str = Form("bottom-center"),
    font_size: int = Form(12),
    start_number: int = Form(1),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    opts = {"position": position, "font_size": font_size, "start_number": start_number}
    job = await _upload_and_create_job([file], JobOperation.page_numbers, opts, db, current_user)
    _dispatch(job, "app.tasks.pdf_tasks.add_page_numbers", db)
    return _build_job_response(job, db)


@router.post("/images-to-pdf", response_model=JobResponse, status_code=201)
async def tool_images_to_pdf(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    job = await _upload_and_create_job(files, JobOperation.images_to_pdf, {}, db, current_user)
    _dispatch(job, "app.tasks.pdf_tasks.images_to_pdf", db)
    return _build_job_response(job, db)


@router.post("/pdf-to-images", response_model=JobResponse, status_code=201)
async def tool_pdf_to_images(
    file: UploadFile = File(...),
    format: str = Form("png"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    job = await _upload_and_create_job([file], JobOperation.pdf_to_images, {"format": format}, db, current_user)
    _dispatch(job, "app.tasks.pdf_tasks.pdf_to_images", db)
    return _build_job_response(job, db)


@router.post("/summarize", response_model=JobResponse, status_code=201)
async def tool_summarize(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    job = await _upload_and_create_job([file], JobOperation.summarize, {}, db, current_user)
    _dispatch(job, "app.tasks.pdf_tasks.summarize_pdf", db)
    return _build_job_response(job, db)


@router.post("/ocr", response_model=JobResponse, status_code=201)
async def tool_ocr(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    job = await _upload_and_create_job([file], JobOperation.ocr, {}, db, current_user)
    _dispatch(job, "app.tasks.pdf_tasks.ocr_pdf", db)
    return _build_job_response(job, db)


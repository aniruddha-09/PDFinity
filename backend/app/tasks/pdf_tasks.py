"""
Celery tasks for all PDF processing operations.
Each task updates the job status in PostgreSQL as it progresses.
"""
import logging
import traceback
from datetime import datetime, timezone
from typing import Any, Dict, List

from celery import Task

from app.workers.celery_app import celery_app
from app.database.session import SessionLocal
from app.models.job import ProcessingJob, JobStatus
from app.models.file import File as FileModel

logger = logging.getLogger(__name__)


def _get_job_and_files(db, job_id: str):
    """Helper: fetch job and its input files from DB."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise ValueError(f"Job {job_id} not found")
    files = db.query(FileModel).filter(FileModel.id.in_(job.input_file_ids)).all()
    file_map = {f.id: f for f in files}
    return job, file_map


def _update_job(db, job: ProcessingJob, **kwargs):
    """Helper: update job fields and flush to DB."""
    for k, v in kwargs.items():
        setattr(job, k, v)
    db.commit()


def _fail_job(db, job: ProcessingJob, error: str):
    _update_job(db, job, status=JobStatus.failed, error_message=error, progress=0)


def _save_output_file(db, job: ProcessingJob, output_path: str, filename: str, mime_type: str) -> FileModel:
    """Persist the output file record and link it to the job."""
    import os
    file_size = os.path.getsize(output_path)
    out_file = FileModel(
        user_id=job.user_id,
        original_filename=filename,
        storage_path=output_path,
        file_size=file_size,
        mime_type=mime_type,
        is_output=True,
    )
    db.add(out_file)
    db.flush()
    job.output_file_id = out_file.id
    job.status = JobStatus.completed
    job.progress = 100
    job.completed_at = datetime.now(timezone.utc)
    db.commit()
    return out_file


# ─── Base task class ─────────────────────────────────────────────────────────

class PDFTask(Task):
    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        job_id = args[0] if args else kwargs.get("job_id")
        if job_id:
            db = SessionLocal()
            try:
                job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
                if job:
                    _fail_job(db, job, str(exc)[:500])
            finally:
                db.close()


# ─── Merge PDF ───────────────────────────────────────────────────────────────

@celery_app.task(bind=True, base=PDFTask, name="app.tasks.pdf_tasks.merge_pdf")
def merge_pdf(self, job_id: str):
    from app.services.merge_service import MergeService
    db = SessionLocal()
    try:
        job, file_map = _get_job_and_files(db, job_id)
        _update_job(db, job, status=JobStatus.processing, progress=10)

        input_paths = [file_map[fid].storage_path for fid in job.input_file_ids if fid in file_map]
        service = MergeService()
        output_path = service.merge(input_paths, job_id)

        _update_job(db, job, progress=80)
        _save_output_file(db, job, output_path, "merged.pdf", "application/pdf")
    except Exception as e:
        logger.error(f"merge_pdf failed for job {job_id}: {traceback.format_exc()}")
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            _fail_job(db, job, str(e)[:500])
    finally:
        db.close()


# ─── Split PDF ───────────────────────────────────────────────────────────────

@celery_app.task(bind=True, base=PDFTask, name="app.tasks.pdf_tasks.split_pdf")
def split_pdf(self, job_id: str):
    from app.services.split_service import SplitService
    db = SessionLocal()
    try:
        job, file_map = _get_job_and_files(db, job_id)
        _update_job(db, job, status=JobStatus.processing, progress=10)

        input_path = file_map[job.input_file_ids[0]].storage_path
        ranges = job.options.get("ranges", [])
        service = SplitService()
        output_path = service.split(input_path, ranges, job_id)

        _update_job(db, job, progress=80)
        mime = "application/zip" if output_path.endswith(".zip") else "application/pdf"
        filename = "split_result.zip" if output_path.endswith(".zip") else "split.pdf"
        _save_output_file(db, job, output_path, filename, mime)
    except Exception as e:
        logger.error(f"split_pdf failed for job {job_id}: {traceback.format_exc()}")
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            _fail_job(db, job, str(e)[:500])
    finally:
        db.close()


# ─── Compress PDF ────────────────────────────────────────────────────────────

@celery_app.task(bind=True, base=PDFTask, name="app.tasks.pdf_tasks.compress_pdf")
def compress_pdf(self, job_id: str):
    from app.services.compress_service import CompressService
    db = SessionLocal()
    try:
        job, file_map = _get_job_and_files(db, job_id)
        _update_job(db, job, status=JobStatus.processing, progress=10)

        input_path = file_map[job.input_file_ids[0]].storage_path
        quality = job.options.get("quality", "recommended")
        service = CompressService()
        output_path, stats = service.compress(input_path, quality, job_id)

        _update_job(db, job, progress=80, options={**job.options, "stats": stats})
        _save_output_file(db, job, output_path, "compressed.pdf", "application/pdf")
    except Exception as e:
        logger.error(f"compress_pdf failed for job {job_id}: {traceback.format_exc()}")
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            _fail_job(db, job, str(e)[:500])
    finally:
        db.close()


# ─── Rotate PDF ──────────────────────────────────────────────────────────────

@celery_app.task(bind=True, base=PDFTask, name="app.tasks.pdf_tasks.rotate_pdf")
def rotate_pdf(self, job_id: str):
    from app.services.rotate_service import RotateService
    db = SessionLocal()
    try:
        job, file_map = _get_job_and_files(db, job_id)
        _update_job(db, job, status=JobStatus.processing, progress=10)

        input_path = file_map[job.input_file_ids[0]].storage_path
        angle = job.options.get("angle", 90)
        pages = job.options.get("pages", "all")
        service = RotateService()
        output_path = service.rotate(input_path, angle, pages, job_id)

        _update_job(db, job, progress=80)
        _save_output_file(db, job, output_path, "rotated.pdf", "application/pdf")
    except Exception as e:
        logger.error(f"rotate_pdf failed for job {job_id}: {traceback.format_exc()}")
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            _fail_job(db, job, str(e)[:500])
    finally:
        db.close()


# ─── Organize PDF (reorder/delete pages) ─────────────────────────────────────

@celery_app.task(bind=True, base=PDFTask, name="app.tasks.pdf_tasks.organize_pdf")
def organize_pdf(self, job_id: str):
    from app.services.organize_service import OrganizeService
    db = SessionLocal()
    try:
        job, file_map = _get_job_and_files(db, job_id)
        _update_job(db, job, status=JobStatus.processing, progress=10)

        input_path = file_map[job.input_file_ids[0]].storage_path
        page_order = job.options.get("page_order", [])
        service = OrganizeService()
        output_path = service.organize(input_path, page_order, job_id)

        _update_job(db, job, progress=80)
        _save_output_file(db, job, output_path, "organized.pdf", "application/pdf")
    except Exception as e:
        logger.error(f"organize_pdf failed for job {job_id}: {traceback.format_exc()}")
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            _fail_job(db, job, str(e)[:500])
    finally:
        db.close()


# ─── Watermark PDF ───────────────────────────────────────────────────────────

@celery_app.task(bind=True, base=PDFTask, name="app.tasks.pdf_tasks.watermark_pdf")
def watermark_pdf(self, job_id: str):
    from app.services.watermark_service import WatermarkService
    db = SessionLocal()
    try:
        job, file_map = _get_job_and_files(db, job_id)
        _update_job(db, job, status=JobStatus.processing, progress=10)

        input_path = file_map[job.input_file_ids[0]].storage_path
        service = WatermarkService()
        output_path = service.add_watermark(input_path, job.options, job_id)

        _update_job(db, job, progress=80)
        _save_output_file(db, job, output_path, "watermarked.pdf", "application/pdf")
    except Exception as e:
        logger.error(f"watermark_pdf failed for job {job_id}: {traceback.format_exc()}")
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            _fail_job(db, job, str(e)[:500])
    finally:
        db.close()


# ─── Add Page Numbers ────────────────────────────────────────────────────────

@celery_app.task(bind=True, base=PDFTask, name="app.tasks.pdf_tasks.add_page_numbers")
def add_page_numbers(self, job_id: str):
    from app.services.page_number_service import PageNumberService
    db = SessionLocal()
    try:
        job, file_map = _get_job_and_files(db, job_id)
        _update_job(db, job, status=JobStatus.processing, progress=10)

        input_path = file_map[job.input_file_ids[0]].storage_path
        service = PageNumberService()
        output_path = service.add_page_numbers(input_path, job.options, job_id)

        _update_job(db, job, progress=80)
        _save_output_file(db, job, output_path, "numbered.pdf", "application/pdf")
    except Exception as e:
        logger.error(f"add_page_numbers failed for job {job_id}: {traceback.format_exc()}")
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            _fail_job(db, job, str(e)[:500])
    finally:
        db.close()


# ─── Images to PDF ───────────────────────────────────────────────────────────

@celery_app.task(bind=True, base=PDFTask, name="app.tasks.pdf_tasks.images_to_pdf")
def images_to_pdf(self, job_id: str):
    from app.services.image_to_pdf_service import ImageToPDFService
    db = SessionLocal()
    try:
        job, file_map = _get_job_and_files(db, job_id)
        _update_job(db, job, status=JobStatus.processing, progress=10)

        input_paths = [file_map[fid].storage_path for fid in job.input_file_ids if fid in file_map]
        service = ImageToPDFService()
        output_path = service.convert(input_paths, job_id)

        _update_job(db, job, progress=80)
        _save_output_file(db, job, output_path, "images.pdf", "application/pdf")
    except Exception as e:
        logger.error(f"images_to_pdf failed for job {job_id}: {traceback.format_exc()}")
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            _fail_job(db, job, str(e)[:500])
    finally:
        db.close()


# ─── PDF to Images ───────────────────────────────────────────────────────────

@celery_app.task(bind=True, base=PDFTask, name="app.tasks.pdf_tasks.pdf_to_images")
def pdf_to_images(self, job_id: str):
    from app.services.pdf_to_image_service import PDFToImageService
    db = SessionLocal()
    try:
        job, file_map = _get_job_and_files(db, job_id)
        _update_job(db, job, status=JobStatus.processing, progress=10)

        input_path = file_map[job.input_file_ids[0]].storage_path
        fmt = job.options.get("format", "png")
        service = PDFToImageService()
        output_path = service.convert(input_path, fmt, job_id)

        _update_job(db, job, progress=80)
        mime = "application/zip" if output_path.endswith(".zip") else f"image/{fmt}"
        filename = f"pages.zip" if output_path.endswith(".zip") else f"page.{fmt}"
        _save_output_file(db, job, output_path, filename, mime)
    except Exception as e:
        logger.error(f"pdf_to_images failed for job {job_id}: {traceback.format_exc()}")
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            _fail_job(db, job, str(e)[:500])
    finally:
        db.close()


# ─── OCR PDF ─────────────────────────────────────────────────────────────────

@celery_app.task(bind=True, base=PDFTask, name="app.tasks.pdf_tasks.ocr_pdf")
def ocr_pdf(self, job_id: str):
    from app.services.ocr_service import OCRService
    db = SessionLocal()
    try:
        job, file_map = _get_job_and_files(db, job_id)
        _update_job(db, job, status=JobStatus.processing, progress=10)

        input_path = file_map[job.input_file_ids[0]].storage_path
        service = OCRService()
        output_path = service.run_ocr(input_path, job_id)

        _update_job(db, job, progress=80)
        _save_output_file(db, job, output_path, "ocr.pdf", "application/pdf")
    except Exception as e:
        logger.error(f"ocr_pdf failed for job {job_id}: {traceback.format_exc()}")
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            _fail_job(db, job, str(e)[:500])
    finally:
        db.close()


# ─── AI Summarize ────────────────────────────────────────────────────────────

@celery_app.task(bind=True, base=PDFTask, name="app.tasks.pdf_tasks.summarize_pdf")
def summarize_pdf(self, job_id: str):
    from app.services.summarize_service import SummarizeService
    db = SessionLocal()
    try:
        job, file_map = _get_job_and_files(db, job_id)
        _update_job(db, job, status=JobStatus.processing, progress=10)

        input_path = file_map[job.input_file_ids[0]].storage_path
        service = SummarizeService()
        summary_result = service.summarize(input_path)

        _update_job(db, job, progress=80, options={**job.options, "result": summary_result})
        job.status = JobStatus.completed
        job.progress = 100
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as e:
        logger.error(f"summarize_pdf failed for job {job_id}: {traceback.format_exc()}")
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            _fail_job(db, job, str(e)[:500])
    finally:
        db.close()

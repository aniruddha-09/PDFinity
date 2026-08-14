from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "pdfusion",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.pdf_tasks",
        "app.tasks.cleanup_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=86400,  # 24 hours
)

# Celery Beat schedule (recurring tasks)
celery_app.conf.beat_schedule = {
    "cleanup-expired-files": {
        "task": "app.tasks.cleanup_tasks.cleanup_expired_files",
        "schedule": crontab(minute="0", hour="*/6"),  # every 6 hours
    },
}

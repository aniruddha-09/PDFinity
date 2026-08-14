import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.database.base import Base, utcnow


class JobStatus(str, enum.Enum):
    pending = "pending"
    uploading = "uploading"
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    expired = "expired"


class JobOperation(str, enum.Enum):
    merge = "merge"
    split = "split"
    compress = "compress"
    rotate = "rotate"
    organize = "organize"
    watermark = "watermark"
    page_numbers = "page_numbers"
    images_to_pdf = "images_to_pdf"
    pdf_to_images = "pdf_to_images"
    ocr = "ocr"
    summarize = "summarize"


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    operation = Column(String, nullable=False)
    status = Column(String, default=JobStatus.pending, nullable=False)
    progress = Column(Integer, default=0)
    input_file_ids = Column(JSON, default=list)     # list of file UUIDs
    output_file_id = Column(String, ForeignKey("files.id", ondelete="SET NULL"), nullable=True)
    options = Column(JSON, default=dict)            # operation-specific options
    error_message = Column(Text, nullable=True)
    celery_task_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="jobs")
    output_file = relationship("File", foreign_keys=[output_file_id])

    def __repr__(self) -> str:
        return f"<Job id={self.id} op={self.operation} status={self.status}>"

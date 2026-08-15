from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

from app.models.job import JobStatus, JobOperation


class JobCreate(BaseModel):
    operation: JobOperation
    input_file_ids: List[str]
    options: Dict[str, Any] = {}


class JobResponse(BaseModel):
    id: str
    operation: str
    status: str
    progress: int
    input_file_ids: List[str]
    output_file_id: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    output_url: Optional[str] = None
    options: Dict[str, Any] = {}

    model_config = {"from_attributes": True}

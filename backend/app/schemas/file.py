from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FileResponse(BaseModel):
    id: str
    original_filename: str
    file_size: int
    mime_type: str
    created_at: datetime
    expires_at: Optional[datetime]

    model_config = {"from_attributes": True}

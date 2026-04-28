from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DatasetBase(BaseModel):
    name: str
    file_type: str
    source_path: Optional[str] = None


class DatasetCreate(DatasetBase):
    pass


class DatasetResponse(DatasetBase):
    id: int
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    file_size_bytes: Optional[int] = None
    overall_quality_score: Optional[float] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

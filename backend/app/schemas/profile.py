from pydantic import BaseModel
from typing import Optional, List, Any, Dict


class ColumnProfileResponse(BaseModel):
    id: int
    dataset_id: int
    column_name: str
    position: Optional[int] = None
    inferred_type: Optional[str] = None
    semantic_type: Optional[str] = None
    type_confidence: Optional[float] = None
    row_count: Optional[int] = None
    null_count: Optional[int] = None
    null_rate: Optional[float] = None
    distinct_count: Optional[int] = None
    is_unique: Optional[bool] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    std_dev: Optional[float] = None
    min_value: Optional[str] = None
    max_value: Optional[str] = None
    q1: Optional[float] = None
    q3: Optional[float] = None
    skewness: Optional[float] = None
    kurtosis: Optional[float] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    avg_length: Optional[float] = None
    top_values: Optional[List[Dict[str, Any]]] = None
    patterns: Optional[List[Dict[str, Any]]] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class QualityResultResponse(BaseModel):
    id: int
    dataset_id: int
    completeness_score: Optional[float] = None
    validity_score: Optional[float] = None
    consistency_score: Optional[float] = None
    accuracy_score: Optional[float] = None
    overall_score: Optional[float] = None
    issues: Optional[Any] = None
    anomalies: Optional[Any] = None

    class Config:
        from_attributes = True


class ProfilingReportResponse(BaseModel):
    dataset_id: int
    dataset_name: str
    row_count: int
    column_count: int
    overall_quality_score: Optional[float] = None
    columns: List[ColumnProfileResponse]
    quality: Optional[QualityResultResponse] = None

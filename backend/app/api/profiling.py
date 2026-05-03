from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import Dataset
from app.models.column_profile import ColumnProfile
from app.models.quality_result import QualityResult
from app.schemas.profile import ProfilingReportResponse
from app.ingestion.csv_connector import load_csv
from app.profiling.statistical import compute_column_statistics
from app.profiling.type_inference import infer_column_type
from app.quality.completeness import compute_completeness
from app.quality.validity import compute_validity
from app.quality.consistency import compute_consistency
from app.quality.accuracy import compute_accuracy
import pandas as pd
import os
import shutil


def _detect_anomalies(series: pd.Series, q1: float, q3: float) -> dict | None:
    """IQR-based outlier detection. Returns None if IQR is zero or data is empty."""
    iqr = q3 - q1
    if iqr == 0:
        return None
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    numeric = pd.to_numeric(series, errors="coerce").dropna()
    if len(numeric) == 0:
        return None
    n_low  = int((numeric < lower).sum())
    n_high = int((numeric > upper).sum())
    total  = n_low + n_high
    return {
        "method": "IQR",
        "lower_bound": round(float(lower), 4),
        "upper_bound": round(float(upper), 4),
        "outlier_count": total,
        "outlier_pct": round(total / len(numeric) * 100, 2),
        "low_outliers": n_low,
        "high_outliers": n_high,
    }

router = APIRouter(prefix="/profile", tags=["Profiling"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=ProfilingReportResponse)
async def upload_and_profile(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported at this stage")

    # Save uploaded file temporarily
    tmp_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(tmp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Load data
        df = load_csv(tmp_path)

        # Create dataset record
        dataset = Dataset(
            name=file.filename,
            file_type="csv",
            source_path=tmp_path,
            row_count=len(df),
            column_count=len(df.columns),
            file_size_bytes=os.path.getsize(tmp_path),
            status="profiling"
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        column_profiles = []
        anomalies_by_column = {}

        for position, col_name in enumerate(df.columns):
            series = df[col_name]

            # Infer type
            inferred_type, confidence = infer_column_type(series)

            # Compute stats
            stats = compute_column_statistics(series, inferred_type)

            # Anomaly detection for numeric columns (IQR method)
            if inferred_type in ("integer", "float"):
                q1_val = stats.get("q1")
                q3_val = stats.get("q3")
                if q1_val is not None and q3_val is not None:
                    anomaly = _detect_anomalies(series, q1_val, q3_val)
                    if anomaly and anomaly["outlier_count"] > 0:
                        anomalies_by_column[col_name] = anomaly

            col_profile = ColumnProfile(
                dataset_id=dataset.id,
                column_name=col_name,
                position=position,
                inferred_type=inferred_type,
                type_confidence=confidence,
                row_count=stats["row_count"],
                null_count=stats["null_count"],
                null_rate=stats["null_rate"],
                distinct_count=stats["distinct_count"],
                is_unique=stats["is_unique"],
                mean=stats.get("mean"),
                median=stats.get("median"),
                std_dev=stats.get("std_dev"),
                min_value=stats.get("min_value"),
                max_value=stats.get("max_value"),
                q1=stats.get("q1"),
                q3=stats.get("q3"),
                skewness=stats.get("skewness"),
                kurtosis=stats.get("kurtosis"),
                min_length=stats.get("min_length"),
                max_length=stats.get("max_length"),
                avg_length=stats.get("avg_length"),
                top_values=stats.get("top_values"),
                patterns=stats.get("patterns"),
            )
            db.add(col_profile)
            column_profiles.append(col_profile)

        # Quality assessment
        completeness_score = compute_completeness(df)
        validity_score     = compute_validity(df)
        consistency_score  = compute_consistency(df)
        accuracy_score     = compute_accuracy(df)
        overall_score = round(
            (completeness_score + validity_score + consistency_score + accuracy_score) / 4, 2
        )

        quality = QualityResult(
            dataset_id=dataset.id,
            completeness_score=completeness_score,
            validity_score=validity_score,
            consistency_score=consistency_score,
            accuracy_score=accuracy_score,
            overall_score=overall_score,
            issues={},
            anomalies=anomalies_by_column,
        )
        db.add(quality)

        dataset.status = "completed"
        dataset.overall_quality_score = overall_score
        db.commit()
        db.refresh(dataset)

        return ProfilingReportResponse(
            dataset_id=dataset.id,
            dataset_name=dataset.name,
            row_count=dataset.row_count,
            column_count=dataset.column_count,
            overall_quality_score=overall_score,
            columns=[c for c in column_profiles],
            quality=quality
        )

    except Exception as e:
        if dataset:
            dataset.status = "failed"
            db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dataset_id}/report", response_model=ProfilingReportResponse)
def get_profiling_report(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    columns = db.query(ColumnProfile).filter(ColumnProfile.dataset_id == dataset_id).all()
    quality = db.query(QualityResult).filter(QualityResult.dataset_id == dataset_id).first()

    return ProfilingReportResponse(
        dataset_id=dataset.id,
        dataset_name=dataset.name,
        row_count=dataset.row_count or 0,
        column_count=dataset.column_count or 0,
        overall_quality_score=dataset.overall_quality_score,
        columns=columns,
        quality=quality
    )

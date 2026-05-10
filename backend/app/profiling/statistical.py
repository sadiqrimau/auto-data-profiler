import pandas as pd
import numpy as np
from typing import Any, Dict


def compute_column_statistics(series: pd.Series, inferred_type: str) -> Dict[str, Any]:
    stats = {}
    total = len(series)
    null_count = series.isna().sum()

    stats["row_count"] = int(total)
    stats["null_count"] = int(null_count)
    stats["null_rate"] = float(round(null_count / total, 4)) if total > 0 else 0.0
    stats["distinct_count"] = int(series.nunique())
    stats["is_unique"] = bool(stats["distinct_count"] == total)

    # Top values by frequency
    top = series.value_counts().head(10)
    stats["top_values"] = [
        {"value": str(k), "count": int(v)} for k, v in top.items()
    ]

    clean = series.dropna()

    if inferred_type in ("integer", "float"):
        numeric = pd.to_numeric(clean, errors="coerce").dropna()
        if len(numeric) > 0:
            stats["mean"] = round(float(numeric.mean()), 4)
            stats["median"] = round(float(numeric.median()), 4)
            stats["std_dev"] = round(float(numeric.std()), 4)
            stats["min_value"] = str(numeric.min())
            stats["max_value"] = str(numeric.max())
            stats["q1"] = round(float(numeric.quantile(0.25)), 4)
            stats["q3"] = round(float(numeric.quantile(0.75)), 4)
            stats["skewness"] = round(float(numeric.skew()), 4)
            stats["kurtosis"] = round(float(numeric.kurtosis()), 4)

    if inferred_type == "string":
        lengths = clean.astype(str).str.len()
        stats["min_length"] = int(lengths.min())
        stats["max_length"] = int(lengths.max())
        stats["avg_length"] = round(float(lengths.mean()), 2)
        stats["patterns"] = detect_patterns(clean)

    if inferred_type == "date":
        stats["min_value"] = str(clean.min())
        stats["max_value"] = str(clean.max())

    return stats


def detect_patterns(series: pd.Series) -> list:
    import re
    patterns = [
        ("email", r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$"),
        ("phone", r"^\+?[\d\s\-\(\)]{7,15}$"),
        ("url", r"^https?://[^\s]+$"),
        ("ip_address", r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$"),
        ("postal_code", r"^\d{5}(-\d{4})?$"),
        ("all_numeric", r"^\d+$"),
        ("alphanumeric", r"^[a-zA-Z0-9]+$"),
    ]

    sample = series.astype(str).head(1000)
    total = len(sample)
    results = []

    for name, pattern in patterns:
        matches = sample.str.match(pattern, na=False).sum()
        coverage = float(round(matches / total, 4))
        if coverage >= 0.5:
            results.append({"pattern": name, "coverage": coverage})

    return results

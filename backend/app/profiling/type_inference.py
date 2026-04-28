import pandas as pd
from typing import Tuple


def infer_column_type(series: pd.Series) -> Tuple[str, float]:
    clean = series.dropna()

    if len(clean) == 0:
        return "unknown", 0.0

    total = len(clean)

    # Try boolean
    bool_values = {"true", "false", "yes", "no", "1", "0"}
    bool_matches = clean.astype(str).str.lower().isin(bool_values).sum()
    if bool_matches / total >= 0.95:
        return "boolean", round(bool_matches / total, 2)

    # Try integer
    try:
        pd.to_numeric(clean, errors="raise").apply(lambda x: int(x) == x)
        numeric = pd.to_numeric(clean, errors="coerce")
        integer_rate = (numeric == numeric.apply(lambda x: int(x) if pd.notna(x) else x)).mean()
        if integer_rate >= 0.95:
            return "integer", round(integer_rate, 2)
    except Exception:
        pass

    # Try float
    numeric = pd.to_numeric(clean, errors="coerce")
    numeric_rate = numeric.notna().sum() / total
    if numeric_rate >= 0.95:
        return "float", round(numeric_rate, 2)

    # Try date
    try:
        parsed = pd.to_datetime(clean, errors="coerce", infer_datetime_format=True)
        date_rate = parsed.notna().sum() / total
        if date_rate >= 0.85:
            return "date", round(date_rate, 2)
    except Exception:
        pass

    # Default to string
    return "string", 1.0

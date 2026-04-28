import pandas as pd


def compute_validity(df: pd.DataFrame) -> float:
    scores = []

    for col in df.columns:
        series = df[col].dropna()
        if len(series) == 0:
            continue

        # Check how many values are non-empty strings or valid numbers
        try:
            numeric = pd.to_numeric(series, errors="coerce")
            valid_rate = numeric.notna().sum() / len(series)
        except Exception:
            valid_rate = series.astype(str).str.strip().ne("").sum() / len(series)

        scores.append(valid_rate)

    if not scores:
        return 0.0

    return round((sum(scores) / len(scores)) * 100, 2)

import pandas as pd


def compute_consistency(df: pd.DataFrame) -> float:
    """
    Two sub-signals averaged:
      1. Dedup rate   – penalises repeated rows  (1 - dup_rate)
      2. Type coherence – fraction of non-null values that conform to the
         dominant type of each column, averaged across columns.
    """
    if df.empty:
        return 0.0

    # 1. Duplicate-row rate
    dup_score = 1.0 - (df.duplicated().sum() / len(df))

    # 2. Per-column type coherence
    type_scores = []
    for col in df.columns:
        series = df[col].dropna()
        if len(series) == 0:
            continue

        numeric = pd.to_numeric(series, errors="coerce")
        numeric_rate = numeric.notna().sum() / len(series)

        if numeric_rate >= 0.5:
            # Numeric-dominant column → coherence = how many parse cleanly
            type_scores.append(float(numeric_rate))
        else:
            # String column → coherence = non-empty, non-whitespace rate
            valid = series.astype(str).str.strip().ne("").sum() / len(series)
            type_scores.append(float(valid))

    type_score = (sum(type_scores) / len(type_scores)) if type_scores else 1.0

    return round(((dup_score + type_score) / 2) * 100, 2)

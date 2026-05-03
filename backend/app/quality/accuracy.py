import pandas as pd

# Common placeholder strings that indicate inaccurate / sentinel data
_PLACEHOLDERS = {
    "n/a", "na", "null", "none", "unknown", "undefined",
    "nil", "#n/a", "nan", "-", "--", "?", "missing", "not available",
}


def compute_accuracy(df: pd.DataFrame) -> float:
    """
    Per-column accuracy averaged across all columns:
      - Numeric columns : IQR outlier-free rate  (1 − outlier_rate)
      - String columns  : fraction of values that are NOT known placeholders
                          or empty strings after stripping whitespace.
    """
    if df.empty:
        return 0.0

    col_scores: list[float] = []

    for col in df.columns:
        series = df[col].dropna()
        if len(series) == 0:
            continue

        numeric = pd.to_numeric(series, errors="coerce")
        numeric_rate = numeric.notna().sum() / len(series)

        if numeric_rate >= 0.5:
            nums = numeric.dropna()
            if len(nums) > 4:
                q1 = float(nums.quantile(0.25))
                q3 = float(nums.quantile(0.75))
                iqr = q3 - q1
                if iqr > 0:
                    lower = q1 - 1.5 * iqr
                    upper = q3 + 1.5 * iqr
                    outlier_rate = float(((nums < lower) | (nums > upper)).sum()) / len(nums)
                    col_scores.append(1.0 - outlier_rate)
                    continue
            col_scores.append(1.0)
        else:
            # String column: penalise placeholder / empty values
            str_s = series.astype(str).str.strip()
            bad = (str_s.str.lower().isin(_PLACEHOLDERS) | str_s.eq("")).sum()
            col_scores.append(1.0 - bad / len(series))

    if not col_scores:
        return 0.0

    return round((sum(col_scores) / len(col_scores)) * 100, 2)

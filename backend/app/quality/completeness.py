import pandas as pd


def compute_completeness(df: pd.DataFrame) -> float:
    total_cells = df.shape[0] * df.shape[1]
    if total_cells == 0:
        return 0.0
    missing_cells = df.isna().sum().sum()
    completeness = 1 - (missing_cells / total_cells)
    return round(float(completeness) * 100, 2)

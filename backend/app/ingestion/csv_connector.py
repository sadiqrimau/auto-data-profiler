import pandas as pd
import chardet


def detect_encoding(file_path: str) -> str:
    with open(file_path, "rb") as f:
        result = chardet.detect(f.read(100000))
    return result.get("encoding", "utf-8") or "utf-8"


def load_csv(file_path: str, sample_size: int = None) -> pd.DataFrame:
    encoding = detect_encoding(file_path)

    # Try common delimiters
    for delimiter in [",", ";", "\t", "|"]:
        try:
            df = pd.read_csv(file_path, encoding=encoding, delimiter=delimiter, low_memory=False)
            if len(df.columns) > 1:
                break
        except Exception:
            continue

    if sample_size and len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42).reset_index(drop=True)

    return df

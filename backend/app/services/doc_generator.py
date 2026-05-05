from __future__ import annotations
import anthropic
from app.config import settings


def _fmt(v, d: int = 2) -> str:
    if v is None:
        return "N/A"
    try:
        f = float(v)
        return str(int(f)) if f == int(f) else f"{f:.{d}f}"
    except (TypeError, ValueError):
        return str(v)


def _build_prompt(dataset, columns, quality) -> str:
    # ── column summary lines ────────────────────────────────────
    anomalies: dict = (quality.anomalies or {}) if quality else {}
    col_lines: list[str] = []
    for c in sorted(columns, key=lambda x: x.position or 0):
        line = (
            f"  - {c.column_name} [{c.inferred_type or 'unknown'}]"
            f" | nulls: {_fmt((c.null_rate or 0) * 100, 1)}%"
            f" | distinct: {c.distinct_count or 'N/A'}"
        )
        if c.inferred_type in ("integer", "float"):
            line += (
                f" | mean: {_fmt(c.mean)} | std: {_fmt(c.std_dev)}"
                f" | range: [{_fmt(c.min_value)} – {_fmt(c.max_value)}]"
            )
            if c.skewness is not None:
                line += f" | skew: {_fmt(c.skewness)}"
        elif c.inferred_type == "string":
            line += f" | avg_len: {_fmt(c.avg_length, 1)} chars"

        a = anomalies.get(c.column_name)
        if a and a.get("outlier_count", 0) > 0:
            line += f" | ⚠ {a['outlier_count']} outliers ({a['outlier_pct']}%)"
        col_lines.append(line)

    # ── quality section ─────────────────────────────────────────
    if quality:
        quality_section = (
            f"- Overall      : {_fmt(quality.overall_score)}/100\n"
            f"- Completeness : {_fmt(quality.completeness_score)}/100\n"
            f"- Validity     : {_fmt(quality.validity_score)}/100\n"
            f"- Consistency  : {_fmt(quality.consistency_score)}/100\n"
            f"- Accuracy     : {_fmt(getattr(quality, 'accuracy_score', None))}/100"
        )
    else:
        quality_section = "Quality assessment not available."

    # ── anomaly summary ─────────────────────────────────────────
    if anomalies:
        anom_lines = [
            f"  - {col}: {a['outlier_count']} outliers "
            f"(below {_fmt(a['lower_bound'])}, above {_fmt(a['upper_bound'])})"
            for col, a in anomalies.items()
        ]
        anomaly_section = "\n".join(anom_lines)
    else:
        anomaly_section = "No anomalies detected."

    return f"""You are a professional data analyst. Generate clear, concise dataset documentation in Markdown.

DATASET: {dataset.name}
ROWS: {dataset.row_count or "N/A"} | COLUMNS: {dataset.column_count or "N/A"} | FORMAT: {dataset.file_type or "csv"}

QUALITY SCORES:
{quality_section}

COLUMN PROFILES:
{chr(10).join(col_lines)}

ANOMALIES:
{anomaly_section}

Write documentation with exactly these sections (use the exact headings):

# {dataset.name} — Dataset Documentation

## Executive Summary
2–3 sentences describing what this dataset contains and its general quality.

## Dataset Overview
Brief description of structure, shape, and data format.

## Column Descriptions
For every column: one paragraph explaining its likely purpose, data type, and any quality concerns.

## Data Quality Analysis
Interpret the four quality scores. Highlight the weakest dimension and why it matters.

## Anomaly Report
Only include if anomalies were found. Explain which columns have outliers and what that could mean.

## Recommendations
3–5 bullet points: concrete, actionable steps to improve data quality before use.

---
Keep language professional and concise. Do not invent facts not in the profiling data.
"""


def generate_dataset_documentation(dataset, columns, quality) -> str:
    """Call Claude API and return the generated markdown string."""
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError(
            "ANTHROPIC_API_KEY is not configured. "
            "Add it as an environment variable in your Render dashboard."
        )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    prompt = _build_prompt(dataset, columns, quality)

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text

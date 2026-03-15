"""
sql_tools.py
============
Structured fact lookup tools that query the SQLite database.

Two tools:
  search_sql_comparison(college1, college2) — comparison table with fees, NIRF, etc.
  search_sql_exam(exam_name)               — exam dates, mode, duration, etc.

Note: The comparisons table is the most reliable data (12,400 rows, mostly complete).
The colleges table has extraction issues so we skip it here and rely on comparisons.
"""

import sqlite3
import re
from pathlib import Path
from typing import Optional

# Path to SQLite DB inside New Perfect Approach/data/
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # New Perfect Approach/
SQLITE_DB = BASE_DIR / "data" / "degreefyd.db"


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(SQLITE_DB))
    conn.row_factory = sqlite3.Row
    return conn


def search_sql_comparison(college1: str, college2: str) -> str:
    """
    Fetch structured comparison data between two colleges from SQLite.
    Returns a formatted markdown table with fees, NIRF rank, courses, etc.

    Args:
        college1: Name or partial name of first college
        college2: Name or partial name of second college
    """
    if not SQLITE_DB.exists():
        return f"Database not found at {SQLITE_DB}"

    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM comparisons
            WHERE (college_1 LIKE ? AND college_2 LIKE ?)
               OR (college_1 LIKE ? AND college_2 LIKE ?)
            LIMIT 1
            """,
            (f"%{college1}%", f"%{college2}%", f"%{college2}%", f"%{college1}%"),
        )
        row = cursor.fetchone()
        conn.close()

        if not row:
            return (
                f"No structured comparison found for '{college1}' vs '{college2}'. "
                f"Try searching the vector database for more details."
            )

        r = dict(row)
        c1 = r.get("college_1", "College 1")
        c2 = r.get("college_2", "College 2")

        lines = [
            f"### Structured Comparison: {c1} vs {c2}\n",
            f"| Parameter | {c1} | {c2} |",
            "|---|---|---|",
        ]

        fields = [
            ("Fees (INR)", "college_1_fees", "college_2_fees"),
            ("NIRF Rank", "college_1_nirf", "college_2_nirf"),
            ("Courses Offered", "college_1_courses", "college_2_courses"),
            ("Established", "college_1_year", "college_2_year"),
            ("Total Students", "college_1_students", "college_2_students"),
            ("College Type", "college_1_type", "college_2_type"),
            ("Rating", "college_1_rating", "college_2_rating"),
            ("Location", "college_1_location", "college_2_location"),
        ]

        for label, k1, k2 in fields:
            v1 = r.get(k1)
            v2 = r.get(k2)
            # Skip rows where both values are missing
            if v1 is None and v2 is None:
                continue
            lines.append(f"| {label} | {v1 or 'N/A'} | {v2 or 'N/A'} |")

        if r.get("url"):
            lines.append(f"\n*Source: {r['url']}*")

        return "\n".join(lines)

    except Exception as e:
        return f"SQL comparison error: {e}"


def search_sql_exam(exam_name: str) -> str:
    """
    Fetch structured exam data from SQLite by exam name.
    Returns dates, conducting body, mode, duration.

    Args:
        exam_name: Exam name or abbreviation (e.g., "JEE Main", "CLAT", "CAT")
    """
    if not SQLITE_DB.exists():
        return f"Database not found at {SQLITE_DB}"

    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM exams
            WHERE name LIKE ? OR full_name LIKE ?
            ORDER BY
                CASE WHEN name = ? THEN 0
                     WHEN name LIKE ? THEN 1
                     ELSE 2
                END
            LIMIT 3
            """,
            (f"%{exam_name}%", f"%{exam_name}%", exam_name.upper(), f"%{exam_name.upper()}%"),
        )
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return f"No exam data found for '{exam_name}' in database."

        output_parts = [f"### Exam Information: {exam_name}\n"]

        for row in rows:
            r = dict(row)
            part = []
            if r.get("full_name"):
                part.append(f"**Full Name**: {r['full_name']}")
            if r.get("exam_date"):
                part.append(f"**Exam Date**: {r['exam_date']}")
            if r.get("conducting_body"):
                # Trim conducting body — sometimes has trailing garbage
                body = r["conducting_body"].strip()[:100]
                part.append(f"**Conducting Body**: {body}")
            if r.get("exam_mode"):
                part.append(f"**Mode**: {r['exam_mode']}")
            if r.get("duration"):
                part.append(f"**Duration**: {r['duration']}")
            if r.get("result_date"):
                part.append(f"**Result Date**: {r['result_date']}")
            if r.get("url"):
                part.append(f"**Source**: {r['url']}")

            if part:
                output_parts.append("\n".join(part))
                output_parts.append("")  # blank line separator

        return "\n".join(output_parts).strip()

    except Exception as e:
        return f"SQL exam error: {e}"


# ── Quick parse helper used by the agent ──────────────────────────────────────

def parse_comparison_query(query: str):
    """
    Parse 'college1 vs college2' string into (college1, college2).
    Returns (query, '') if no 'vs' pattern found.
    """
    parts = re.split(r"\s+vs\.?\s+", query, flags=re.IGNORECASE)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return query.strip(), ""


if __name__ == "__main__":
    print(search_sql_comparison("IIT Bombay", "IIT Delhi"))
    print(search_sql_exam("CLAT"))

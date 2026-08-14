"""Split a PDF by page ranges and return either a single PDF or a ZIP archive."""
import os
import re
import zipfile
from pathlib import Path
from typing import List, Tuple

import fitz  # PyMuPDF

from app.core.config import settings


def _parse_ranges(ranges: List[str], total_pages: int) -> List[Tuple[int, int]]:
    """
    Convert range strings like ["1-3", "5", "7-9"] to list of (start, end) 0-based
    inclusive page index tuples. Falls back to splitting every page if no ranges given.
    """
    if not ranges:
        # Default: each page is its own part
        return [(i, i) for i in range(total_pages)]

    result = []
    for r in ranges:
        r = r.strip()
        if "-" in r:
            parts = r.split("-", 1)
            start = max(int(parts[0]) - 1, 0)
            end = min(int(parts[1]) - 1, total_pages - 1)
        else:
            idx = max(int(r) - 1, 0)
            start = end = min(idx, total_pages - 1)
        result.append((start, end))
    return result


class SplitService:
    def __init__(self):
        self.output_dir = Path(settings.PROCESSED_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def split(self, input_path: str, ranges: List[str], job_id: str) -> str:
        """
        Split *input_path* by *ranges*. Returns path to a single PDF if only
        one range is produced, or a ZIP archive for multiple parts.
        """
        src = fitz.open(input_path)
        total = src.page_count
        parts = _parse_ranges(ranges, total)

        if len(parts) == 1:
            start, end = parts[0]
            out_doc = fitz.open()
            out_doc.insert_pdf(src, from_page=start, to_page=end)
            out_path = self.output_dir / f"{job_id}_split.pdf"
            out_doc.save(str(out_path), garbage=4, deflate=True)
            out_doc.close()
            src.close()
            return str(out_path)

        # Multiple parts → ZIP
        zip_path = self.output_dir / f"{job_id}_split.zip"
        with zipfile.ZipFile(str(zip_path), "w", zipfile.ZIP_DEFLATED) as zf:
            for i, (start, end) in enumerate(parts, start=1):
                part_doc = fitz.open()
                part_doc.insert_pdf(src, from_page=start, to_page=end)
                part_path = self.output_dir / f"{job_id}_part{i}.pdf"
                part_doc.save(str(part_path), garbage=4, deflate=True)
                part_doc.close()
                zf.write(str(part_path), f"part{i}.pdf")
                os.unlink(str(part_path))

        src.close()
        return str(zip_path)

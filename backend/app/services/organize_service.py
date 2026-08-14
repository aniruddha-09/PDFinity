"""Reorder or delete pages of a PDF according to a page_order list."""
from pathlib import Path
from typing import List

import fitz  # PyMuPDF

from app.core.config import settings


class OrganizeService:
    def __init__(self):
        self.output_dir = Path(settings.PROCESSED_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def organize(self, input_path: str, page_order: List[int], job_id: str) -> str:
        """
        Reorder / delete pages according to *page_order*.

        *page_order* is a list of 1-based page numbers in the desired output order.
        Pages not listed are omitted (deleted). If empty, returns a copy as-is.

        Returns the absolute path of the reorganized PDF.
        """
        src = fitz.open(input_path)
        total = src.page_count

        if not page_order:
            # No-op: return a clean copy
            page_order = list(range(1, total + 1))

        # Convert to 0-based, clamp to valid range
        zero_based = [max(0, min(p - 1, total - 1)) for p in page_order]

        out_doc = fitz.open()
        for page_idx in zero_based:
            out_doc.insert_pdf(src, from_page=page_idx, to_page=page_idx)

        output_path = self.output_dir / f"{job_id}_organized.pdf"
        out_doc.save(str(output_path), garbage=4, deflate=True)
        out_doc.close()
        src.close()

        return str(output_path)

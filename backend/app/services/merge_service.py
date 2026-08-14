"""Merge multiple PDFs into a single PDF using PyMuPDF."""
import os
from pathlib import Path
from typing import List

import fitz  # PyMuPDF

from app.core.config import settings


class MergeService:
    def __init__(self):
        self.output_dir = Path(settings.PROCESSED_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def merge(self, input_paths: List[str], job_id: str) -> str:
        """
        Merge PDFs at *input_paths* (in order) and write to a single output file.
        Returns the absolute path of the merged PDF.
        """
        if not input_paths:
            raise ValueError("No input files provided for merge.")

        output_path = self.output_dir / f"{job_id}_merged.pdf"
        merged_doc = fitz.open()

        for path in input_paths:
            src = fitz.open(path)
            merged_doc.insert_pdf(src)
            src.close()

        merged_doc.save(str(output_path), garbage=4, deflate=True)
        merged_doc.close()

        return str(output_path)

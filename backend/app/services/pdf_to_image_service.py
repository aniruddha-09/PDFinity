"""Render PDF pages to images (PNG/JPEG) using PyMuPDF, return ZIP if >1 page."""
import os
import zipfile
from pathlib import Path

import fitz  # PyMuPDF

from app.core.config import settings

DPI = 150
ZOOM = DPI / 72  # 72 is the base PDF DPI


class PDFToImageService:
    def __init__(self):
        self.output_dir = Path(settings.PROCESSED_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def convert(self, input_path: str, fmt: str, job_id: str) -> str:
        """
        Render each page of the PDF to an image.

        *fmt* is "png" or "jpeg".
        Returns the path to a single image (if 1-page doc) or a ZIP archive.
        """
        fmt = fmt.lower()
        if fmt not in ("png", "jpeg", "jpg"):
            fmt = "png"
        if fmt == "jpg":
            fmt = "jpeg"

        ext = "jpg" if fmt == "jpeg" else "png"
        mat = fitz.Matrix(ZOOM, ZOOM)

        doc = fitz.open(input_path)
        page_count = doc.page_count

        if page_count == 1:
            page = doc[0]
            pix = page.get_pixmap(matrix=mat, alpha=False)
            out_path = self.output_dir / f"{job_id}_page1.{ext}"
            pix.save(str(out_path))
            doc.close()
            return str(out_path)

        # Multiple pages → ZIP
        zip_path = self.output_dir / f"{job_id}_pages.zip"
        with zipfile.ZipFile(str(zip_path), "w", zipfile.ZIP_DEFLATED) as zf:
            for i, page in enumerate(doc, start=1):
                pix = page.get_pixmap(matrix=mat, alpha=False)
                img_path = self.output_dir / f"{job_id}_page{i}.{ext}"
                pix.save(str(img_path))
                zf.write(str(img_path), f"page{i}.{ext}")
                os.unlink(str(img_path))

        doc.close()
        return str(zip_path)

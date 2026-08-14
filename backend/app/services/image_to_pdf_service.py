"""Convert a list of images (JPEG/PNG/WebP) to a single PDF using PyMuPDF."""
from pathlib import Path
from typing import List

import fitz  # PyMuPDF

from app.core.config import settings


class ImageToPDFService:
    def __init__(self):
        self.output_dir = Path(settings.PROCESSED_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def convert(self, input_paths: List[str], job_id: str) -> str:
        """
        Convert *input_paths* images (in order) into a single PDF.
        Each image becomes one page sized to the image's natural dimensions.
        Returns the absolute path of the output PDF.
        """
        if not input_paths:
            raise ValueError("No image files provided for conversion.")

        out_doc = fitz.open()

        for img_path in input_paths:
            # Open the image as a PDF page
            img_doc = fitz.open(img_path)
            # Wrap image as a single-page PDF
            img_pdf_bytes = img_doc.convert_to_pdf()
            img_doc.close()

            img_pdf = fitz.open("pdf", img_pdf_bytes)
            out_doc.insert_pdf(img_pdf)
            img_pdf.close()

        output_path = self.output_dir / f"{job_id}_images.pdf"
        out_doc.save(str(output_path), garbage=4, deflate=True)
        out_doc.close()

        return str(output_path)

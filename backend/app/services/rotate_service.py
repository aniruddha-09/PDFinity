"""Rotate all or selected pages of a PDF."""
from pathlib import Path
from typing import List, Union

import fitz  # PyMuPDF

from app.core.config import settings


def _resolve_pages(pages_spec: Union[str, List[int]], total: int) -> List[int]:
    """
    Parse a pages specification into a list of 0-based page indices.

    Accepts:
    - "all" → every page
    - "1,3,5" → specific 1-based page numbers
    - [0, 2, 4] → already a list of 0-based indices
    """
    if pages_spec == "all" or not pages_spec:
        return list(range(total))
    if isinstance(pages_spec, list):
        return [p if p < total else total - 1 for p in pages_spec]
    # comma-separated 1-based page numbers
    result = []
    for part in str(pages_spec).split(","):
        part = part.strip()
        if part:
            idx = int(part) - 1
            if 0 <= idx < total:
                result.append(idx)
    return result


class RotateService:
    def __init__(self):
        self.output_dir = Path(settings.PROCESSED_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def rotate(
        self,
        input_path: str,
        angle: int,
        pages: Union[str, List[int]],
        job_id: str,
    ) -> str:
        """
        Rotate *pages* of the PDF at *input_path* by *angle* degrees (must be 0/90/180/270).
        Returns the path of the output PDF.
        """
        valid_angles = {0, 90, 180, 270}
        angle = int(angle) % 360
        if angle not in valid_angles:
            raise ValueError(f"Angle must be one of {valid_angles}, got {angle}")

        doc = fitz.open(input_path)
        target_pages = _resolve_pages(pages, doc.page_count)

        for page_idx in target_pages:
            page = doc[page_idx]
            page.set_rotation((page.rotation + angle) % 360)

        output_path = self.output_dir / f"{job_id}_rotated.pdf"
        doc.save(str(output_path), garbage=4, deflate=True)
        doc.close()
        return str(output_path)

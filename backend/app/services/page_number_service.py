"""Add page numbers to every page of a PDF using PyMuPDF."""
from pathlib import Path
from typing import Any, Dict

import fitz  # PyMuPDF

from app.core.config import settings

# Mapping of position name → (x-fraction, y-fraction, h-align)
# h-align: 0=left, 1=center, 2=right (for reference only; we compute x manually)
POSITION_MAP = {
    "bottom-center": (0.5, 0.95),
    "bottom-left":   (0.05, 0.95),
    "bottom-right":  (0.95, 0.95),
    "top-center":    (0.5, 0.05),
    "top-left":      (0.05, 0.05),
    "top-right":     (0.95, 0.05),
}


class PageNumberService:
    def __init__(self):
        self.output_dir = Path(settings.PROCESSED_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def add_page_numbers(
        self, input_path: str, options: Dict[str, Any], job_id: str
    ) -> str:
        """
        Overlay page numbers on every page.

        Expected *options* keys:
            position     (str) : "bottom-center" | "bottom-left" | ... default "bottom-center"
            font_size    (int) : font point size, default 12
            start_number (int) : first page number to display, default 1
            color        (list): [r, g, b] 0–1, default [0, 0, 0]
        """
        position = options.get("position", "bottom-center")
        font_size = int(options.get("font_size", 12))
        start_number = int(options.get("start_number", 1))
        color_raw = options.get("color", [0, 0, 0])
        color = tuple(float(c) for c in color_raw)

        pos_frac = POSITION_MAP.get(position, POSITION_MAP["bottom-center"])

        doc = fitz.open(input_path)
        for i, page in enumerate(doc):
            page_num = start_number + i
            label = str(page_num)
            w, h = page.rect.width, page.rect.height
            x = w * pos_frac[0]
            y = h * pos_frac[1]

            page.insert_text(
                fitz.Point(x, y),
                label,
                fontsize=font_size,
                color=color,
                overlay=True,
            )

        output_path = self.output_dir / f"{job_id}_numbered.pdf"
        doc.save(str(output_path), garbage=4, deflate=True)
        doc.close()
        return str(output_path)

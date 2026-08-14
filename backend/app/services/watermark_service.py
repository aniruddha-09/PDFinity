"""Add a text watermark to every page of a PDF using PyMuPDF."""
import math
from pathlib import Path
from typing import Any, Dict

import fitz  # PyMuPDF

from app.core.config import settings

# Named positions map (x-fraction, y-fraction) relative to page size
POSITIONS = {
    "center": (0.5, 0.5),
    "top-left": (0.15, 0.15),
    "top-right": (0.85, 0.15),
    "bottom-left": (0.15, 0.85),
    "bottom-right": (0.85, 0.85),
    "top-center": (0.5, 0.15),
    "bottom-center": (0.5, 0.85),
}


class WatermarkService:
    def __init__(self):
        self.output_dir = Path(settings.PROCESSED_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def add_watermark(self, input_path: str, options: Dict[str, Any], job_id: str) -> str:
        """
        Overlay a text watermark on every page of the PDF.

        Expected *options* keys:
            text       (str)   : watermark text, default "CONFIDENTIAL"
            font_size  (int)   : font size in pt, default 48
            opacity    (float) : 0.0–1.0, default 0.3
            angle      (int)   : rotation angle in degrees, default 45
            position   (str)   : named position or "center", default "center"
            color      (list)  : [r, g, b] 0–1 floats, default [0.5, 0.5, 0.5]
        """
        text = options.get("text", "CONFIDENTIAL")
        font_size = int(options.get("font_size", 48))
        opacity = float(options.get("opacity", 0.3))
        angle = float(options.get("angle", 45))
        position = options.get("position", "center")
        color_raw = options.get("color", [0.5, 0.5, 0.5])
        color = tuple(float(c) for c in color_raw)

        pos_frac = POSITIONS.get(position, POSITIONS["center"])

        doc = fitz.open(input_path)
        for page in doc:
            w, h = page.rect.width, page.rect.height
            cx = w * pos_frac[0]
            cy = h * pos_frac[1]

            # Insert the text with rotation
            page.insert_text(
                fitz.Point(cx, cy),
                text,
                fontsize=font_size,
                color=color,
                rotate=angle,
                overlay=True,
                fill_opacity=opacity,
            )

        output_path = self.output_dir / f"{job_id}_watermarked.pdf"
        doc.save(str(output_path), garbage=4, deflate=True)
        doc.close()
        return str(output_path)

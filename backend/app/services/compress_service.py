"""Compress a PDF using Ghostscript or PyMuPDF engine fallback."""
import os
import subprocess
import shutil
from pathlib import Path
from typing import Tuple, Dict, Any

import fitz  # PyMuPDF

from app.core.config import settings

# Ghostscript quality presets
GS_QUALITY_MAP = {
    "low": "/screen",        # 72 dpi
    "recommended": "/ebook",  # 150 dpi — good balance
    "high": "/printer",      # 300 dpi
    "maximum": "/prepress",  # 300 dpi, colour-managed
}


def _find_gs() -> str | None:
    """Locate the Ghostscript executable if installed."""
    for candidate in ("gs", "gswin64c", "gswin32c"):
        path = shutil.which(candidate)
        if path:
            return path
    return None


class CompressService:
    def __init__(self):
        self.output_dir = Path(settings.PROCESSED_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def compress(
        self, input_path: str, quality: str, job_id: str
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Compress *input_path* using Ghostscript if available, otherwise high-performance PyMuPDF.
        """
        output_path = self.output_dir / f"{job_id}_compressed.pdf"
        gs_exe = _find_gs()
        original_size = os.path.getsize(input_path)

        if gs_exe:
            try:
                gs_setting = GS_QUALITY_MAP.get(quality, "/ebook")
                cmd = [
                    gs_exe,
                    "-sDEVICE=pdfwrite",
                    "-dCompatibilityLevel=1.4",
                    f"-dPDFSETTINGS={gs_setting}",
                    "-dNOPAUSE",
                    "-dQUIET",
                    "-dBATCH",
                    f"-sOutputFile={output_path}",
                    input_path,
                ]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
                if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    compressed_size = os.path.getsize(str(output_path))
                    ratio = round((1 - compressed_size / original_size) * 100, 1) if original_size else 0
                    stats = {
                        "original_size": original_size,
                        "compressed_size": compressed_size,
                        "reduction_percent": max(0, ratio),
                        "quality": quality,
                    }
                    return str(output_path), stats
            except Exception:
                pass  # Fallback to PyMuPDF below

        # PyMuPDF Compression Fallback
        doc = fitz.open(input_path)
        # Apply garbage collection, stream deflation, and unused object removal
        deflate_val = True
        garbage_val = 4
        clean_val = True

        doc.save(
            str(output_path),
            garbage=garbage_val,
            deflate=deflate_val,
            clean=clean_val,
            deflate_images=True,
            deflate_fonts=True,
        )
        doc.close()

        compressed_size = os.path.getsize(str(output_path))
        ratio = round((1 - compressed_size / original_size) * 100, 1) if original_size else 0

        stats = {
            "original_size": original_size,
            "compressed_size": compressed_size,
            "reduction_percent": max(0, ratio),
            "quality": quality,
        }
        return str(output_path), stats

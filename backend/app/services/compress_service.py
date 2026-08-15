"""Compress a PDF using Ghostscript or advanced PyMuPDF + Pillow image recompression engine."""
import os
import subprocess
import shutil
import io
from pathlib import Path
from typing import Tuple, Dict, Any

import fitz  # PyMuPDF
from PIL import Image

from app.core.config import settings

# Ghostscript quality presets
GS_QUALITY_MAP = {
    "low": "/screen",        # 72 dpi
    "recommended": "/ebook",  # 150 dpi — good balance
    "high": "/printer",      # 300 dpi
    "maximum": "/prepress",  # 300 dpi, colour-managed
}

PYMUPDF_QUALITY_MAP = {
    "low": {"max_dim": 1024, "quality": 50},          # Extreme compression (~72 DPI / heavy JPEG compression)
    "recommended": {"max_dim": 1600, "quality": 72},  # Balanced (~150 DPI / optimal clarity)
    "high": {"max_dim": 2400, "quality": 85},         # High quality (~220-300 DPI / crisp)
    "maximum": {"max_dim": 3200, "quality": 92},
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
        Compress *input_path* using Ghostscript if available, otherwise advanced PyMuPDF + Pillow recompression.
        """
        output_path = self.output_dir / f"{job_id}_compressed.pdf"
        gs_exe = _find_gs()
        original_size = os.path.getsize(input_path)

        # 1. Try Ghostscript if available
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
                    # Only use GS output if it did not bloat the file
                    if compressed_size <= original_size:
                        ratio = round((1 - compressed_size / original_size) * 100, 1) if original_size else 0
                        stats = {
                            "original_size": original_size,
                            "compressed_size": compressed_size,
                            "reduction_percent": max(0.0, ratio),
                            "quality": quality,
                        }
                        return str(output_path), stats
            except Exception:
                pass  # Fallback to PyMuPDF below

        # 2. PyMuPDF + Pillow Smart Image Downscaling and Recompression
        cfg = PYMUPDF_QUALITY_MAP.get(quality, PYMUPDF_QUALITY_MAP["recommended"])
        doc = fitz.open(input_path)
        processed_xrefs = set()

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            image_list = page.get_images(full=True)
            for img_info in image_list:
                xref = img_info[0]
                if xref in processed_xrefs:
                    continue
                processed_xrefs.add(xref)

                try:
                    base_img = doc.extract_image(xref)
                    if not base_img:
                        continue
                    img_bytes = base_img.get("image")
                    if not img_bytes:
                        continue

                    orig_img_len = len(img_bytes)
                    pil_img = Image.open(io.BytesIO(img_bytes))

                    # Downscale dimensions if needed
                    w, h = pil_img.size
                    max_d = cfg["max_dim"]
                    if max(w, h) > max_d:
                        scale = max_d / max(w, h)
                        new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
                        pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

                    out_buf = io.BytesIO()
                    # Handle transparency / color modes
                    if pil_img.mode in ("RGBA", "LA") or (pil_img.mode == "P" and "transparency" in pil_img.info):
                        if quality in ("low", "recommended"):
                            bg = Image.new("RGB", pil_img.size, (255, 255, 255))
                            if pil_img.mode == "RGBA":
                                bg.paste(pil_img, mask=pil_img.split()[3])
                            else:
                                bg.paste(pil_img.convert("RGB"))
                            bg.save(out_buf, format="JPEG", quality=cfg["quality"], optimize=True)
                        else:
                            pil_img.save(out_buf, format="PNG", optimize=True)
                    else:
                        if pil_img.mode != "RGB":
                            pil_img = pil_img.convert("RGB")
                        pil_img.save(out_buf, format="JPEG", quality=cfg["quality"], optimize=True)

                    compressed_img_bytes = out_buf.getvalue()
                    # Replace only if new compressed size is smaller
                    if len(compressed_img_bytes) < orig_img_len:
                        page.replace_image(xref, stream=compressed_img_bytes)
                except Exception:
                    pass

        # Apply structural optimization, font & stream deflation
        doc.save(
            str(output_path),
            garbage=4,
            deflate=True,
            clean=True,
            deflate_images=True,
            deflate_fonts=True,
        )
        doc.close()

        compressed_size = os.path.getsize(str(output_path))
        # If the output ended up slightly larger (e.g. minimal 1-page text PDF), fallback to copying original
        if compressed_size > original_size:
            shutil.copyfile(input_path, str(output_path))
            compressed_size = original_size

        ratio = round((1 - compressed_size / original_size) * 100, 1) if original_size else 0

        stats = {
            "original_size": original_size,
            "compressed_size": compressed_size,
            "reduction_percent": max(0.0, ratio),
            "quality": quality,
        }
        return str(output_path), stats


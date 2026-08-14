"""OCR a PDF using ocrmypdf to add a searchable text layer."""
import subprocess
import shutil
from pathlib import Path

from app.core.config import settings


class OCRService:
    def __init__(self):
        self.output_dir = Path(settings.PROCESSED_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def run_ocr(self, input_path: str, job_id: str) -> str:
        """
        Run OCR on *input_path* using ocrmypdf. Creates a PDF with a hidden
        text layer that makes the document searchable / copy-pasteable.

        Returns the absolute path of the OCR-enhanced PDF.
        Raises RuntimeError if ocrmypdf is not installed or fails.
        """
        if not shutil.which("ocrmypdf"):
            raise RuntimeError(
                "ocrmypdf is not installed. "
                "Install it with: pip install ocrmypdf (also requires Tesseract and Ghostscript)."
            )

        output_path = self.output_dir / f"{job_id}_ocr.pdf"

        cmd = [
            "ocrmypdf",
            "--skip-text",        # skip pages that already have text
            "--optimize", "1",    # light optimization
            "--quiet",
            input_path,
            str(output_path),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

        # ocrmypdf exit code 6 means "all pages already have text" — that's fine
        if result.returncode not in (0, 6):
            raise RuntimeError(
                f"ocrmypdf failed (code {result.returncode}): {result.stderr[:500]}"
            )

        return str(output_path)

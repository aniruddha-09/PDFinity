"""
AI-powered PDF summarization service.
Extracts text from the PDF, chunks it to fit token limits, and calls
the OpenAI Chat API to produce a structured markdown summary.
"""
import logging
from pathlib import Path
from typing import Any, Dict

import fitz  # PyMuPDF

from app.ai.openai_client import chat_complete, count_tokens_approx

logger = logging.getLogger(__name__)

# ~3000 tokens per chunk to stay well under context limits even on mini models
MAX_CHUNK_TOKENS = 3000
MAX_CHUNKS = 8  # limit total context sent to avoid large bills


SYSTEM_PROMPT = (
    "You are a professional document analyst. "
    "The user will provide text extracted from a PDF document. "
    "Produce a concise, well-structured markdown summary with the following sections:\n"
    "## Overview\n"
    "## Key Points\n"
    "## Important Details\n"
    "## Conclusion\n\n"
    "Keep the total summary under 600 words. Use bullet points where appropriate."
)


def _extract_text(input_path: str) -> str:
    """Extract all text from the PDF using PyMuPDF."""
    doc = fitz.open(input_path)
    pages_text = []
    for page in doc:
        text = page.get_text("text").strip()
        if text:
            pages_text.append(text)
    doc.close()
    return "\n\n".join(pages_text)


def _chunk_text(text: str) -> list[str]:
    """Split text into chunks that fit within MAX_CHUNK_TOKENS."""
    words = text.split()
    chunks = []
    current: list[str] = []
    current_tokens = 0

    for word in words:
        word_tokens = len(word) // 4 + 1
        if current_tokens + word_tokens > MAX_CHUNK_TOKENS and current:
            chunks.append(" ".join(current))
            current = []
            current_tokens = 0
        current.append(word)
        current_tokens += word_tokens

    if current:
        chunks.append(" ".join(current))

    return chunks[:MAX_CHUNKS]


class SummarizeService:
    def summarize(self, input_path: str) -> Dict[str, Any]:
        """
        Summarize the PDF at *input_path*.

        Returns a dict with keys:
            summary   (str) : markdown summary text
            page_count (int): number of pages
            word_count (int): approximate word count of extracted text
        """
        text = _extract_text(input_path)

        if not text.strip():
            raise ValueError(
                "No readable text found in the PDF. "
                "Try running OCR first if this is a scanned document."
            )

        word_count = len(text.split())
        chunks = _chunk_text(text)

        if len(chunks) == 1:
            user_content = chunks[0]
        else:
            # Summarise each chunk first, then combine
            chunk_summaries = []
            for i, chunk in enumerate(chunks, start=1):
                logger.info(f"Summarising chunk {i}/{len(chunks)}")
                partial = chat_complete(
                    messages=[
                        {"role": "system", "content": "Summarise the following text excerpt in 3-5 sentences."},
                        {"role": "user", "content": chunk},
                    ],
                    max_tokens=300,
                )
                chunk_summaries.append(partial)
            user_content = "\n\n".join(chunk_summaries)

        summary = chat_complete(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            max_tokens=1024,
        )

        # Derive page count from fitz
        doc = fitz.open(input_path)
        page_count = doc.page_count
        doc.close()

        return {
            "summary": summary,
            "page_count": page_count,
            "word_count": word_count,
        }

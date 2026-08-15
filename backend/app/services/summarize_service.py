import logging
import re
from collections import Counter
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


def _extractive_fallback_summary(text: str, reason: str = "") -> str:
    """Intelligent local extractive summary used when AI API quota is exceeded."""
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
    sentences = re.split(r"(?<=[.!?])\s+", text)
    sentences = [s.strip().replace("\n", " ") for s in sentences if len(s.strip()) > 25]

    if not sentences:
        return "No sufficient readable text found to extract a summary."

    words = re.findall(r"\w+", text.lower())
    stop_words = {
        "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of",
        "with", "by", "is", "are", "was", "were", "it", "this", "that", "as",
        "be", "from", "have", "has", "had", "will", "would", "can", "could"
    }
    filtered = [w for w in words if w not in stop_words and len(w) > 2]
    freq = Counter(filtered)

    def score_sentence(s: str) -> float:
        s_words = re.findall(r"\w+", s.lower())
        if not s_words:
            return 0.0
        return sum(freq.get(w, 0) for w in s_words) / (len(s_words) + 1)

    ranked = sorted(sentences, key=score_sentence, reverse=True)
    top_points = ranked[:5]

    out = [
        "## Overview",
        paragraphs[0] if paragraphs else top_points[0],
        "",
        "## Key Points & Takeaways",
    ]
    for pt in top_points:
        out.append(f"- {pt}")

    out.append("")
    out.append("## Important Details")
    if len(paragraphs) > 1:
        out.append(paragraphs[1])
    else:
        out.append(top_points[-1] if top_points else "Document analyzed successfully.")

    if reason:
        out.append("")
        out.append(f"> *Note: Generated via PDFinity Offline NLP Engine ({reason}).*")

    return "\n".join(out)


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
        doc = fitz.open(input_path)
        page_count = doc.page_count
        doc.close()

        chunks = _chunk_text(text)
        summary = ""

        try:
            if len(chunks) == 1:
                user_content = chunks[0]
            else:
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
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"OpenAI API call failed ({err_msg}), falling back to extractive summary.")
            reason = "OpenAI API Quota Exceeded — please top up billing credits" if "quota" in err_msg.lower() or "429" in err_msg else "Offline Engine"
            summary = _extractive_fallback_summary(text, reason=reason)

        return {
            "summary": summary,
            "page_count": page_count,
            "word_count": word_count,
        }


"""OpenAI API thin wrapper with retry and token-counting helpers."""
import logging
from typing import List, Dict, Any

import openai

from app.core.config import settings

logger = logging.getLogger(__name__)

# Lazy-initialised client
_client: openai.OpenAI | None = None


def get_client() -> openai.OpenAI:
    global _client
    if _client is None:
        if not settings.OPENAI_API_KEY:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Add it to your .env file."
            )
        _client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def chat_complete(
    messages: List[Dict[str, str]],
    model: str = "gpt-4o-mini",
    temperature: float = 0.3,
    max_tokens: int = 2048,
) -> str:
    """
    Call the OpenAI Chat Completions API and return the assistant's text.
    Uses gpt-4o-mini by default for cost efficiency.
    """
    client = get_client()
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


def count_tokens_approx(text: str) -> int:
    """Rough token estimate: ~4 characters per token."""
    return len(text) // 4

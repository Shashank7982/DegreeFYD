"""
followup_generator.py
=====================
Generates 3 relevant follow-up question suggestions after every bot answer.

Uses llama-3.1-8b-instant (fast + cheap) — just needs to suggest questions,
not reason deeply. Entire call adds ~100ms latency.

Returns a list of 3 short strings for the frontend to render as chips.
"""

import json
import os
import re
from typing import List

from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
_client = None


def _get_client():
    global _client
    if _client is None:
        from groq import Groq
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


_SYSTEM = (
    "You are an Indian college counseling assistant. "
    "Based on what a student just asked and the answer they received, "
    "suggest exactly 3 short follow-up questions they might want to ask next. "
    "Questions should be specific, useful, and naturally continue the conversation. "
    "Return ONLY a valid JSON array of 3 strings. No explanation, no prefix, no markdown. "
    "Example: [\"What is the hostel fee?\", \"Compare with IIT Delhi\", \"What is the JEE cutoff?\"]"
)


def generate_followups(question: str, answer: str) -> List[str]:
    """
    Generate 3 follow-up question suggestions.

    Args:
        question: The student's original/rewritten question
        answer:   The bot's final answer (truncated if long)

    Returns:
        List of 3 follow-up question strings, or [] on failure
    """
    try:
        # Truncate answer to avoid burning tokens — first 400 chars capture the key info
        short_answer = answer[:400] + ("..." if len(answer) > 400 else "")

        resp = _get_client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": _SYSTEM},
                {
                    "role": "user",
                    "content": (
                        f"Student asked: {question}\n\n"
                        f"Bot answered: {short_answer}\n\n"
                        f"Suggest 3 follow-up questions:"
                    ),
                },
            ],
            max_tokens=120,
            temperature=0.7,
        )

        raw = resp.choices[0].message.content.strip()

        # Parse JSON array — extract even if model wraps it in text
        match = re.search(r"\[.*?\]", raw, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            if isinstance(parsed, list):
                # Take first 3, ensure they're non-empty strings
                return [str(q).strip() for q in parsed if str(q).strip()][:3]

    except Exception as e:
        print(f"[FollowupGenerator] Error: {e}")

    return []

"""
query_rewriter.py
=================
Rewrites ambiguous follow-up questions into standalone questions
using the conversation history.

Example:
  history: [User: "Tell me about IIT Bombay", Bot: "IIT Bombay is..."]
  query:   "what about its fees?"
  output:  "What are the fees at IIT Bombay?"

Uses a fast, cheap model (llama-3.1-8b-instant) — not the big reasoning model.
"""

import os
from typing import List, Dict
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
_REWRITER_MODEL = "llama-3.1-8b-instant"  # Fast + cheap — just rewrites, doesn't reason

# Signals that the query is likely referencing something from history
_AMBIGUOUS_SIGNALS = [
    " it ", " its ", " their ", " there ", " that ", " this ",
    "both", "the college", "the university", "the institute",
    "the exam", "the course", "tell me more", "what about",
    "how about", "same", "either", "neither", "which one",
    "which is better", "compare them", "difference", "fees there",
    "over there", "that one", "the other", "the first", "the second",
]

_client = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


def _is_ambiguous(query: str) -> bool:
    q = f" {query.lower()} "
    return any(signal in q for signal in _AMBIGUOUS_SIGNALS)


def rewrite_query(query: str, history: List[Dict]) -> str:
    """
    Rewrites a potentially ambiguous follow-up query into a fully standalone question.

    Args:
        query:   The user's current message
        history: List of dicts: [{"user": "...", "assistant": "..."}, ...]
                 Frontend sends history as [{"role":"user","content":"..."},{"role":"assistant","content":"..."}]
                 This function handles both formats.

    Returns:
        A standalone query string (original if already standalone)
    """
    if not history:
        return query

    if not _is_ambiguous(query):
        return query

    # Build a short history string (last 3 turns max, truncate long bot responses)
    history_lines = []
    turns = history[-3:]
    for turn in turns:
        # Handle both {"user":..., "assistant":...} and {"role":..., "content":...} formats
        if "role" in turn:
            role = turn["role"]
            content = turn["content"]
            if role == "user":
                history_lines.append(f"Student: {content}")
            elif role == "assistant":
                short = content[:250] + "..." if len(content) > 250 else content
                history_lines.append(f"Bot: {short}")
        else:
            if turn.get("user"):
                history_lines.append(f"Student: {turn['user']}")
            if turn.get("assistant"):
                short = turn["assistant"][:250] + "..." if len(turn["assistant"]) > 250 else turn["assistant"]
                history_lines.append(f"Bot: {short}")

    history_text = "\n".join(history_lines)

    try:
        resp = _get_client().chat.completions.create(
            model=_REWRITER_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a query rewriter for an Indian education chatbot. "
                        "Given conversation history and a follow-up question, rewrite the "
                        "follow-up as a COMPLETE standalone question by replacing all pronouns "
                        "and vague references with specific names from the history. "
                        "Return ONLY the rewritten question — no explanation, no prefix like 'Rewritten:'."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Conversation history:\n{history_text}\n\n"
                        f"Follow-up question: {query}\n\n"
                        f"Rewritten standalone question:"
                    ),
                },
            ],
            max_tokens=80,
            temperature=0.0,
        )
        rewritten = resp.choices[0].message.content.strip().strip('"').strip("'")
        if len(rewritten) > 10:
            print(f"[QueryRewriter] '{query}' → '{rewritten}'")
            return rewritten
    except Exception as e:
        print(f"[QueryRewriter] Error: {e} — using original query")

    return query

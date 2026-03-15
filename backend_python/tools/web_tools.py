"""
web_tools.py
============
Live web search via Groq compound-beta model.

compound-beta has built-in web search — no scraping, no rate limits, no CAPTCHA.
Groq automatically decides when to search and synthesizes results into a clean answer.
Much more reliable than Google/DuckDuckGo HTML scraping.
"""

import os
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
_client = None


def _get_groq_client():
    global _client
    if _client is None:
        from groq import Groq
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


def search_web(query: str, max_results: int = 3) -> str:
    """
    Search the web using Groq's compound-beta model (built-in web search).
    Returns a synthesized, accurate answer with citations.

    Args:
        query: The search query (e.g. "IIT Bombay BTech fees 2025")
    """
    print(f"[WebSearch] compound-beta searching: '{query}'")
    try:
        resp = _get_groq_client().chat.completions.create(
            model="compound-beta",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a research assistant for an Indian higher education platform. "
                        "Search the web and provide accurate, specific, up-to-date information "
                        "about Indian colleges, universities, fees, NIRF rankings, entrance exams, "
                        "cutoffs, and admissions. Include specific numbers and dates when available."
                    ),
                },
                {
                    "role": "user",
                    "content": query,
                },
            ],
            max_tokens=1024,
        )

        content = resp.choices[0].message.content or ""

        # Extract web search citations if compound-beta used them
        citations = ""
        executed = getattr(resp.choices[0].message, "executed_tools", None)
        if executed:
            urls = []
            for tool in executed:
                url = None
                if isinstance(tool, dict):
                    url = (tool.get("output") or {}).get("url") or tool.get("url")
                else:
                    url = getattr(getattr(tool, "output", None), "url", None)
                if url:
                    urls.append(url)
            if urls:
                citations = "\n\n*Sources: " + " | ".join(urls[:3]) + "*"

        return f"### Web Search Results (Groq compound-beta):\n{content}{citations}"

    except Exception as e:
        return (
            f"Web search failed: {e}. "
            "Try using vector database or SQL tools for this information."
        )


# Test if run directly
if __name__ == "__main__":
    print(search_web("VIT Vellore BTech CSE fees 2025"))

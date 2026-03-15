"""
model_loader.py
===============
Groq-only architecture:
  - generate_reasoning(): llama-3.3-70b-versatile for all ReAct Think/Act/Observe steps.
  - generate_final(): llama-3.3-70b-versatile for polished final answer synthesis.
  - generate(): backward-compatible alias → generate_reasoning().

All calls go through Groq API. No local model required.
"""

import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Groq models
GROQ_REASONING_MODEL = "llama-3.3-70b-versatile"  # ReAct loop + final answer
GROQ_FAST_MODEL      = "llama-3.1-8b-instant"      # Query rewriting & follow-ups


class DegreeFYDModel:
    _instance = None
    _groq_client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load()
        return cls._instance

    def _load(self):
        """Initialise Groq client."""
        if not GROQ_API_KEY:
            print("[ModelLoader] WARNING: GROQ_API_KEY missing in .env — all LLM calls will fail.")
            return
        try:
            from groq import Groq
            self._groq_client = Groq(api_key=GROQ_API_KEY)
            print(f"[ModelLoader] Groq client ready — using {GROQ_REASONING_MODEL}")
        except ImportError:
            print("[ModelLoader] groq package not installed. Run: pip install groq")

    # ── Public API ────────────────────────────────────────────────────────────

    def generate_reasoning(self, messages: list, stop: list = None, max_tokens: int = 1024) -> str:
        """
        Used for all Think/Act/Observe steps in the ReAct loop.
        Always uses Groq's large model — reliable instruction following is critical here.
        """
        return self._groq_generate(
            messages=messages,
            model=GROQ_REASONING_MODEL,
            max_tokens=max_tokens,
            stop=stop,
        )

    def generate_final(self, query: str, assembled_context: str, mode: str = "detailed") -> str:
        """
        Polished final answer synthesis using Groq.

        Args:
            query:             The student's standalone question.
            assembled_context: Raw FINAL ANSWER text from the ReAct loop.
            mode:              "detailed" (default) or "concise"
        """
        sql_warning = (
            "IMPORTANT — SQL data in the research notes may be corrupted: "
            "NIRF ranks showing as 1 for non-top colleges are wrong (use your own knowledge to correct them), "
            "fees like '41' mean ₹41,000 (interpret correctly), "
            "entity names like 'LPU Phagwara' or 'CU Distance Education' are DB artifacts (use real names). "
            "Always cross-verify SQL figures with your training knowledge and silently correct errors."
        )

        if mode == "concise":
            system_content = (
                "You are DegreeFYD Assistant, an expert Indian college counselor. "
                "Give a brief, focused answer using the research notes. "
                "3-5 sentences or a short bullet list. Key facts only — no lengthy intros. "
                "Use a comparison table ONLY if two colleges are being compared side by side. "
                + sql_warning
            )
            user_content = (
                f"Research notes:\n{assembled_context}\n\n"
                f"Student question: {query}\n\n"
                "Write a concise answer. "
                "Then on the very last line, write exactly this format with 3 real follow-up questions a student would naturally ask next (replace the angle-bracket placeholders with actual questions):\n"
                "FOLLOW_UPS: <follow-up question 1>? | <follow-up question 2>? | <follow-up question 3>?"
            )
            max_tokens = 600
        else:
            system_content = (
                "You are DegreeFYD Assistant, an expert Indian college counselor. "
                "Using the research notes below, write a comprehensive, well-structured answer. "
                "Cover ALL relevant details: fees, deadlines, procedures, eligibility, placements, "
                "rankings, scholarship options — whatever the question requires. "
                "Use markdown with ## headings, bullet points, and tables. "
                "ALWAYS present college overviews as a single side-by-side markdown table, "
                "never as separate bullet-point blocks per college. "
                "Do NOT truncate — students need complete information. "
                + sql_warning
            )
            user_content = (
                f"Research notes:\n{assembled_context}\n\n"
                f"Student question: {query}\n\n"
                "Write the full detailed answer. "
                "Then on the very last line, write exactly this format with 3 real follow-up questions a student would naturally ask next (replace the angle-bracket placeholders with actual questions):\n"
                "FOLLOW_UPS: <follow-up question 1>? | <follow-up question 2>? | <follow-up question 3>?"
            )
            max_tokens = 1600

        polish_messages = [
            {"role": "system", "content": system_content},
            {"role": "user",   "content": user_content},
        ]
        return self._groq_generate(
            messages=polish_messages,
            model=GROQ_REASONING_MODEL,
            max_tokens=max_tokens,
        )

    def generate(self, messages: list, max_new_tokens: int = 512, stop: list = None) -> str:
        """Backward-compatible alias → routes to generate_reasoning()."""
        return self.generate_reasoning(messages=messages, stop=stop, max_tokens=max_new_tokens)

    # ── Private helpers ───────────────────────────────────────────────────────

    def _groq_generate(self, messages: list, model: str, max_tokens: int, stop: list = None) -> str:
        if self._groq_client is None:
            return "Error: Groq client not initialized. Check GROQ_API_KEY in .env"
        try:
            kwargs = dict(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7,
            )
            if stop:
                kwargs["stop"] = stop
            resp = self._groq_client.chat.completions.create(**kwargs)
            return resp.choices[0].message.content
        except Exception as e:
            return f"Groq API error: {e}"


# Singleton accessor
def get_model() -> DegreeFYDModel:
    return DegreeFYDModel()

"""
agent.py
========
ReAct (Reason + Act) agent for DegreeFYD.

Flow per request:
  1. Inject conversation history into message context
  2. Rewrite ambiguous follow-up query to standalone using QueryRewriter
  3. ReAct loop (max 3 hops):
       THOUGHT → why I need what I need
       ACTION  → call one tool
       [Python executes tool, injects result as OBSERVATION]
       THOUGHT → do I have enough?
       FINAL ANSWER → formatted markdown response
  4. If loop exits without FINAL ANSWER → force one extra generation
  5. Return {answer, rewritten_query, tools_used}

Fixes applied vs original:
  - history is now accepted and injected (was silently dropped)
  - query_rewriter resolves ambiguous follow-ups ("what about its fees?")
  - stop token unified to "OBSERVATION:" only (was inconsistently "OBSERVE:" / "OBSERVATION:")
  - 4 tools: search_vector_db, search_sql_comparison, search_sql_exam, search_web
  - _parse_action handles optional second argument for doc_type
  - fallback forces a final answer instead of returning raw reasoning text
  - _format_prompt() dead code removed
  - return dict with metadata for frontend (tools used, rewritten query)
"""

import re
import random
import asyncio
from typing import List, Dict, Optional, Tuple
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

from model_loader import DegreeFYDModel
from tools.vector_tools import search_vectors
from tools.web_tools import search_web
from tools.sql_tools import search_sql_comparison, search_sql_exam, parse_comparison_query
from query_rewriter import rewrite_query


# ── System Prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are DegreeFYD Assistant, an expert Indian college and entrance exam counselor.
Your goal is to give accurate, data-backed advice to students.

## TOOLS AVAILABLE

1. **search_vector_db(query, doc_type)**
   - Searches 129,000+ knowledge base chunks from degreefyd.com
   - doc_type (optional): "college" | "comparison" | "exam" | "blog" | "course"
   - Use for: campus life, placements, course details, college overviews, reviews

2. **search_sql_comparison("college1 vs college2")**
   - Structured database table: fees, NIRF rank, courses, established year, type, location
   - Use for: any direct comparison between two colleges
   - Format: search_sql_comparison("IIT Bombay vs IIT Delhi")

3. **search_sql_exam("exam_name")**
   - Structured exam data: dates, conducting body, mode, duration
   - Use for: exam dates, schedules, eligibility facts
   - Format: search_sql_exam("JEE Main")

4. **search_web(query)**
   - Live internet search (searches degreefyd.com first, then broader)
   - Use for: 2025/2026 cutoffs, very latest fees, recent news
   - Use ONLY when vector_db and SQL tools don't have the answer

## SQL DATA WARNING
SQL tools (search_sql_comparison, search_sql_exam) may return corrupted data:
- NIRF ranks showing as 1 for non-top colleges → use YOUR OWN KNOWLEDGE for correct rank
- Fees showing as "41" instead of "41,000" → interpret correctly using your knowledge
- College names may be database artifacts (e.g. "LPU Phagwara", "CU Distance Education") → normalise to real names
ALWAYS cross-verify SQL figures against your training knowledge. If they conflict, trust your knowledge.

## STRICT FORMAT (follow exactly every loop)

THOUGHT: [what information you need and why]
ACTION: tool_name("argument")
OBSERVATION: [system fills this — STOP generating immediately after writing ACTION line]

When you have enough information:
THOUGHT: I have sufficient information to answer the question.
FINAL ANSWER:
[MODE_INSTRUCTION_PLACEHOLDER — replaced at runtime based on concise/detailed setting]

## RULES
- You may issue 1-2 ACTION lines per loop ONLY if you are certain you need both results simultaneously
- If calling multiple tools, list each on its own ACTION: line consecutively (back-to-back)
- Always start with THOUGHT before ACTION
- STOP immediately after writing the ACTION line — do not write OBSERVATION yourself
- Use markdown tables when comparing two or more colleges
- Never say "check the website" — give the actual fee figures, dates, and facts
- If a tool returns no data, try a different tool or approach before giving up
- If all tools fail, answer from training knowledge but note it is approximate
- FINAL ANSWER must ALWAYS be detailed and complete — never a short or truncated response"""


# ── Off-topic guard ───────────────────────────────────────────────────────────

# Per-category off-topic suggestions so refusals feel contextually relevant
_OFF_TOPIC_SUGGESTIONS: dict = {
    "Colleges": [
        "What is the fee structure at VIT Vellore for BTech CSE?",
        "Top NIRF-ranked engineering colleges in India 2026?",
        "Admission process at BITS Pilani for BTech?",
        "Best MBA colleges in India under 5 lakhs total fee?",
        "What hostel facilities does Amity University offer?",
    ],
    "Exams": [
        "What is the JEE Main 2026 exam date and syllabus?",
        "How to apply for NEET 2026?",
        "What is the GATE 2026 syllabus for Computer Science?",
        "CAT 2026 eligibility and registration dates?",
        "How to crack JEE Advanced — best preparation strategy?",
    ],
    "Compare": [
        "Compare IIT Bombay vs IIT Delhi fees and placements",
        "NIT Trichy vs NIT Warangal — which is better for CSE?",
        "BITS Pilani vs VIT for BTech CSE?",
        "IIM Ahmedabad vs IIM Bangalore for MBA?",
        "Manipal vs SRM University — fees and placements?",
    ],
    "Predictor": [
        "Which colleges can I get with 80 percentile in JEE Main?",
        "What rank do I need for NIT Trichy CSE?",
        "NEET score 550 — which medical colleges can I get?",
        "CAT 85 percentile — which IIMs can I target?",
        "JEE Main rank 15000 — what are my options?",
    ],
    "default": [
        "What is the JEE Main 2026 exam date?",
        "Compare IIT Bombay vs IIT Delhi fees and placements",
        "Which colleges can I get with 80 percentile in JEE Main?",
        "What is the fee structure at VIT Vellore for BTech CSE?",
        "Top engineering colleges in India by NIRF ranking?",
        "How to apply for NEET 2026?",
        "NIT Trichy vs NIT Warangal — which is better for CSE?",
        "What is the GATE 2026 syllabus for Computer Science?",
        "Admission process at BITS Pilani for BTech?",
    ],
}

# Category context injected into the first user message to bias the agent's focus
_CATEGORY_CONTEXT: dict = {
    "Colleges": (
        "The student is browsing the Colleges section and wants information about specific colleges "
        "— fees, admissions, eligibility, placements, campus life, NIRF ranking."
    ),
    "Exams": (
        "The student is in the Exams section and is focused on entrance exams "
        "(JEE, NEET, GATE, CAT, CLAT, MHT CET etc.) — dates, syllabus, preparation, cutoffs."
    ),
    "Compare": (
        "The student is in the Compare section and wants a side-by-side comparison of colleges or programs. "
        "Always present comparisons as a markdown table."
    ),
    "Predictor": (
        "The student is in the Predictor section and wants to know which colleges they qualify for "
        "based on their rank, score, or percentile."
    ),
}

_COUNSELLING_KEYWORDS = [
    "counselling", "counseling", "counsel", "free session", "book a session",
    "schedule a session", "talk to advisor", "talk to counsellor", "talk to expert",
    "help with admission", "guidance session", "career guidance", "expert advice",
    "speak to someone", "connect me", "get help", "need advice",
]

def _is_counselling_intent(query: str) -> bool:
    """Returns True if the user is asking for counselling/expert guidance."""
    q_lower = query.lower()
    return any(kw in q_lower for kw in _COUNSELLING_KEYWORDS)

_GROQ_FAST_CLIENT = None


def _get_fast_client():
    global _GROQ_FAST_CLIENT
    if _GROQ_FAST_CLIENT is None:
        _GROQ_FAST_CLIENT = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _GROQ_FAST_CLIENT

def _is_off_topic(query: str) -> bool:
    """
    Returns True if the query is not a genuine education question for Indian students.

    Uses a single well-crafted LLM call with explicit instructions to handle
    tricky cases like:
      - Education terms used as decoration: "what is jee advance donald trump meaning?"  → OFF-TOPIC
      - Ambiguous short queries: "what should I do?"  → judged by context
      - Genuine education queries: "JEE Main 2026 dates?"  → ON-TOPIC

    Fails open (returns False) on any API error so the agent always gets a chance.
    """
    try:
        resp = _get_fast_client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a strict topic classifier for an Indian education chatbot. "
                        "Answer ONLY with YES or NO — no explanation.\n\n"
                        "Answer YES if the query is a GENUINE question about:\n"
                        "  - Indian colleges, universities, IITs, NITs, IIMs, BITS, medical colleges\n"
                        "  - Entrance exams: JEE, NEET, GATE, CAT, CLAT, CUET, MHT CET, KCET etc.\n"
                        "  - Admissions, cutoffs, eligibility, fees, scholarships, placements\n"
                        "  - Courses: BTech, MBBS, MBA, BSc etc.\n"
                        "  - Career guidance after 10th/12th in the Indian context\n\n"
                        "Answer NO if the query:\n"
                        "  - Merely MENTIONS an exam or college name but is actually asking about "
                        "something completely unrelated (politics, celebrities, food, sports, "
                        "random meanings, jokes etc.)\n"
                        "  - Is nonsensical or gibberish even if it contains education words\n"
                        "  - Is about a non-education topic regardless of any education keywords present\n\n"
                        "Examples:\n"
                        "  'JEE Main 2026 exam dates?' → YES\n"
                        "  'what is jee advance donald trump meaning?' → NO\n"
                        "  'best IIT for CSE?' → YES\n"
                        "  'IIT vs Harvard which is more famous in cricket?' → NO\n"
                        "  'NEET cutoff for AIIMS 2025?' → YES\n"
                        "  'how to make momos at home?' → NO\n"
                        "  'fee structure at VIT Vellore?' → YES\n"
                        "  'what is nit meaning in politics?' → NO"
                    ),
                },
                {"role": "user", "content": query},
            ],
            temperature=0,
            max_tokens=5,
        )
        answer = resp.choices[0].message.content.strip().upper()
        return answer.startswith("NO")
    except Exception as e:
        print(f"[Agent] Off-topic check error: {e}")
        return False  # fail open — let the agent try


# ── Agent ─────────────────────────────────────────────────────────────────────

class Agent:
    def __init__(self):
        self.model = DegreeFYDModel()   # Singleton — model loaded once
        self.max_loops = 5
        self._tool_cache: Dict = {}     # #9 cross-request tool cache: (tool_name, arg) -> result
        self._CACHE_MAX = 500           # evict oldest when limit reached

    async def run(self, user_query: str, history: List[Dict] = None, mode: str = "detailed", web_search: bool = False, category: str = "") -> Dict:
        """
        Run the full ReAct loop for a user query.

        Args:
            user_query:  The student's current message
            history:     List of previous turns.
            mode:        "detailed" (default) or "concise"
            web_search:  If True, nudges agent to use search_web first for live data

        Returns:
            {"answer", "rewritten_query", "tools_used"}
        """
        history = history or []

        # Build mode-specific FINAL ANSWER instruction
        if mode == "concise":
            mode_instruction = (
                "Write a brief, focused answer in 3-5 sentences or a short bullet list. "
                "Give the key facts only — no lengthy intros, no repeated overviews. "
                "Use a table ONLY if directly comparing two colleges side by side."
            )
        else:
            mode_instruction = (
                "Write a comprehensive, detailed response. Cover ALL aspects: fees (total program cost "
                "per semester), deadlines, eligibility, admission procedures, placement stats, NIRF ranking, "
                "campus facilities, scholarship options — whatever is relevant. Use markdown with ## headings, "
                "bullet points, and tables (required for any comparison). Aim for 3-6 paragraphs or equivalent "
                "structured content. Never truncate. Never say 'check the website' — include actual figures. "
                "ALWAYS present college overview data as a single side-by-side markdown table, never as "
                "separate bullet-point blocks for each college."
            )

        # Inject mode instruction into system prompt
        active_system_prompt = SYSTEM_PROMPT.replace(
            "[MODE_INSTRUCTION_PLACEHOLDER — replaced at runtime based on concise/detailed setting]",
            mode_instruction,
        )

        # Step 1 — rewrite ambiguous follow-up to standalone query
        # Skip the rewriter on the first message (no history = nothing to resolve)
        standalone = rewrite_query(user_query, history) if history else user_query

        # Step 1b — counselling intent check (before off-topic guard)
        if _is_counselling_intent(standalone):  # type: ignore
            return {
                "answer": "counselling_prompt",
                "rewritten_query": standalone,
                "tools_used": [],
                "follow_ups": [],
                "counselling_prompt": True,
            }

        # Step 1c — off-topic guard
        if _is_off_topic(standalone):
            pool = _OFF_TOPIC_SUGGESTIONS.get(category, _OFF_TOPIC_SUGGESTIONS["default"])
            suggestions = random.sample(pool, min(3, len(pool)))
            refusal = (
                "I'm DegreeFYD's educational assistant, so I can only help with topics related to "
                "Indian colleges, universities, entrance exams, admissions, fees, and placements.\n\n"
                "I'm not able to answer questions outside of education.\n\n"
                "**You might be interested in:**"
            )
            return {
                "answer": refusal,
                "rewritten_query": standalone,
                "tools_used": [],
                "follow_ups": suggestions,
            }

        # Step 2 — build messages: system prompt + history + current question
        messages = [{"role": "system", "content": active_system_prompt}]

        # Inject last 4 turns of history (8 messages: 4 user + 4 assistant)
        for turn in history[-4:]:
            if "role" in turn:
                messages.append({"role": turn["role"], "content": turn["content"]})
            else:
                if turn.get("user"):
                    messages.append({"role": "user", "content": turn["user"]})
                if turn.get("assistant"):
                    messages.append({"role": "assistant", "content": turn["assistant"]})

        # Build user message — add category context on first query, web search nudge if enabled
        user_content = standalone

        # Inject category context only on the very first message (no history yet)
        if category and not history:
            ctx = _CATEGORY_CONTEXT.get(category, "")
            if ctx:
                user_content = f"{user_content}\n\n[Category context: {ctx}]"

        if web_search:
            user_content = (
                f"{standalone}\n\n"
                "[Web search is ON — use search_web as your first tool to get the most current data, "
                "then supplement with search_vector_db if needed.]"
            )
        messages.append({"role": "user", "content": user_content})

        # Step 3 — ReAct loop
        tools_used: List[str] = []
        last_content = ""
        # #9 use persistent cross-request cache (evict oldest if over cap)
        if len(self._tool_cache) >= self._CACHE_MAX:
            oldest = next(iter(self._tool_cache))
            del self._tool_cache[oldest]
            print(f"[Cache] Evicted oldest entry (cap={self._CACHE_MAX})")
        _cache = self._tool_cache   # local alias — same dict, persists after return

        for loop_i in range(self.max_loops):
            print(f"[Agent] Loop {loop_i + 1}/{self.max_loops}")

            # Generate THOUGHT + ACTION (stops at "OBSERVATION:")
            content = self.model.generate_reasoning(
                messages,
                stop=["OBSERVATION:"],
                max_tokens=1024,
            )
            print(f"[Agent] Model output:\n{content}\n")

            messages.append({"role": "assistant", "content": content})
            last_content = content

            # Check if the model gave a final answer
            if "FINAL ANSWER:" in content:
                raw_answer = content.split("FINAL ANSWER:", 1)[-1].strip()
                final = self.model.generate_final(standalone, raw_answer, mode=mode)
                # Extract embedded follow-up chips if present
                follow_ups = []
                if "FOLLOW_UPS:" in final:
                    parts = final.rsplit("FOLLOW_UPS:", 1)
                    final = parts[0].strip()
                    follow_ups = [q.strip() for q in parts[1].split("|") if q.strip()][:3]
                return {
                    "answer": final,
                    "rewritten_query": standalone,
                    "tools_used": tools_used,
                    "follow_ups": follow_ups,
                }

            # ── #9 + #10: parse ALL ACTION lines, cache + parallel execute ──
            all_actions = self._parse_all_actions(content)

            if all_actions:
                if len(all_actions) == 1:
                    # Single tool call — cache-first, run in thread to stay async
                    tool_name, tool_arg, tool_type = all_actions[0]
                    tools_used.append(tool_name)
                    cache_key = (tool_name, tool_arg or "")
                    if cache_key in _cache:
                        print(f"[Cache HIT] {tool_name}({tool_arg!r}) — skipping round-trip")
                        observation = _cache[cache_key]
                    else:
                        observation = await asyncio.to_thread(
                            self._execute_tool, tool_name, tool_arg, tool_type
                        )
                        _cache[cache_key] = observation
                    print(f"[Agent] Observation ({tool_name}): {observation[:120]}...")
                    messages.append({
                        "role": "user",
                        "content": (
                            f"OBSERVATION: {observation}\n\n"
                            "Continue. Do you have enough information? "
                            "If yes, write THOUGHT then FINAL ANSWER. "
                            "If no, write THOUGHT then ACTION: tool_name(\"query\")."
                        ),
                    })
                else:
                    # Multiple tools — run uncached ones in parallel (#10)
                    uncached: List[Tuple] = []
                    results_map: Dict = {}
                    for (tn, ta, tt) in all_actions:
                        key = (tn, ta or "")
                        if key in _cache:
                            print(f"[Cache HIT] {tn}({ta!r}) — skipping round-trip")
                            results_map[key] = _cache[key]
                        else:
                            uncached.append((key, tn, ta, tt))

                    if uncached:
                        print(f"[Agent] Parallel execution: {[t[1] for t in uncached]}")
                        parallel_results = await asyncio.gather(*[
                            asyncio.to_thread(self._execute_tool, tn, ta, tt)
                            for (key, tn, ta, tt) in uncached
                        ])
                        for (key, tn, ta, tt), res in zip(uncached, parallel_results):
                            _cache[key] = res
                            results_map[key] = res
                            print(f"[Agent] Parallel result ({tn}): {res[:80]}...")

                    for (tn, ta, _) in all_actions:
                        tools_used.append(tn)

                    obs_block = "\n\n".join(
                        f"[Tool: {tn}({ta!r})]\n{results_map[(tn, ta or '')]}"
                        for (tn, ta, _) in all_actions
                    )
                    messages.append({
                        "role": "user",
                        "content": (
                            f"OBSERVATIONS:\n{obs_block}\n\n"
                            "Continue. Do you have enough information? "
                            "If yes, write THOUGHT then FINAL ANSWER. "
                            "If no, write THOUGHT then ACTION: tool_name(\"query\")."
                        ),
                    })
            else:
                # Model output ACTION in wrong format or gave text without ACTION/FINAL ANSWER
                print(f"[Agent] Could not parse action. Nudging model.")
                messages.append({
                    "role": "user",
                    "content": (
                        "You must either:\n"
                        "  (a) Call a tool: ACTION: tool_name(\"argument\")\n"
                        "  (b) Give a final answer: FINAL ANSWER: [your answer]\n"
                        "Please proceed."
                    ),
                })

        # Step 4 — Loop limit reached without FINAL ANSWER
        # Force one final generation to synthesize what was found
        print("[Agent] Loop limit reached. Forcing final answer synthesis.")
        messages.append({
            "role": "user",
            "content": (
                "You have reached the maximum number of tool calls. "
                "Based on everything you found above, write a thorough FINAL ANSWER now. "
                "Cover ALL relevant details — fees, dates, rankings, procedures, eligibility, "
                "placements, facilities. Use markdown headings, bullet points, and tables where "
                "helpful. Do NOT truncate. Format:\n"
                "FINAL ANSWER:\n[your comprehensive detailed answer]"
            ),
        })
        forced = self.model.generate_reasoning(messages, max_tokens=1024)
        follow_ups = []
        if "FINAL ANSWER:" in forced:
            answer = self.model.generate_final(standalone, forced.split("FINAL ANSWER:", 1)[-1].strip(), mode=mode)
            if "FOLLOW_UPS:" in answer:
                parts = answer.rsplit("FOLLOW_UPS:", 1)
                answer = parts[0].strip()
                follow_ups = [q.strip() for q in parts[1].split("|") if q.strip()][:3]
        else:
            # Last resort — strip reasoning markers and return what we have
            answer = re.sub(r"(THOUGHT:|ACTION:|OBSERVATION:)", "", forced).strip()
            if not answer:
                answer = "I found some information but couldn't compile a complete answer. Please try rephrasing your question."

        return {
            "answer": answer,
            "rewritten_query": standalone,
            "tools_used": tools_used,
            "follow_ups": follow_ups,
        }

    # ── Private helpers ───────────────────────────────────────────────────────

    def _parse_all_actions(self, text: str) -> List[Tuple[str, str, Optional[str]]]:
        """
        #9 + #10: Find ALL ACTION: lines in model output.

        Returns list of (tool_name, primary_arg, optional_second_arg).
        Empty list when no valid ACTION line is found.
        """
        pattern = (
            r"ACTION:\s*[`]?(\w+)[`]?\s*\(\s*"
            r"[\"'](.+?)[\"']"
            r"(?:\s*,\s*[\"'](.+?)[\"'])?"
            r"\s*\)"
        )
        matches = re.findall(pattern, text, re.IGNORECASE)
        result = [(tn, ta, tt if tt else None) for (tn, ta, tt) in matches]
        if not result:
            print(f"[Agent] _parse_all_actions: no ACTION found in: {repr(text[-200:])}")
        return result

    def _parse_action(self, text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """Legacy single-action parse — delegates to _parse_all_actions."""
        actions = self._parse_all_actions(text)
        return actions[0] if actions else (None, None, None)

    def _execute_tool(self, tool_name: str, arg: str, extra: Optional[str] = None) -> str:
        """Dispatch tool call and return result string."""
        tool_name_lower = tool_name.lower()
        try:
            if tool_name_lower == "search_vector_db":
                # extra = doc_type (optional)
                return search_vectors(arg, doc_type=extra)

            elif tool_name_lower == "search_sql_comparison":
                # arg can be "IIT Bombay vs IIT Delhi" or just a college name
                c1, c2 = parse_comparison_query(arg)
                if not c2 and extra:
                    c2 = extra
                if not c2:
                    return f"Please provide two college names. Format: search_sql_comparison(\"College A vs College B\")"
                return search_sql_comparison(c1, c2)

            elif tool_name_lower == "search_sql_exam":
                return search_sql_exam(arg)

            elif tool_name_lower == "search_web":
                return search_web(arg)

            else:
                available = "search_vector_db, search_sql_comparison, search_sql_exam, search_web"
                return f"Unknown tool '{tool_name}'. Available tools: {available}"

        except Exception as e:
            return f"Tool '{tool_name}' error: {e}"


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    agent = Agent()
    result = agent.run("What are the fees at IIT Bombay for BTech CSE?")
    print("\n=== FINAL ANSWER ===")
    print(result["answer"])
    print(f"\nRewritten query: {result['rewritten_query']}")
    print(f"Tools used: {result['tools_used']}")

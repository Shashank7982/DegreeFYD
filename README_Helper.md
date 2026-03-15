# DegreeFYD Agentic RAG Chatbot

An intelligent, multi-tool AI chatbot for Indian higher education counseling. Built on a **ReAct (Reason + Act)** agent loop with **Retrieval-Augmented Generation (RAG)**, it can answer questions about college admissions, fees, rankings, entrance exams, college comparisons, and admission predictions — all grounded in real data.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Folder Structure](#folder-structure)
5. [Backend Deep Dive](#backend-deep-dive)
   - [ReAct Agent](#react-agent)
   - [Tool 1 — Vector Search (ChromaDB + HyDE + CRAG)](#tool-1--vector-search-chromadb--hyde--crag)
   - [Tool 2 — SQL Comparison Lookup](#tool-2--sql-comparison-lookup)
   - [Tool 3 — SQL Exam Lookup](#tool-3--sql-exam-lookup)
   - [Tool 4 — Live Web Search](#tool-4--live-web-search)
   - [Query Rewriter](#query-rewriter)
   - [Follow-up Generator](#follow-up-generator)
   - [Off-topic Guard](#off-topic-guard)
   - [Counselling Intent Detector](#counselling-intent-detector)
   - [FastAPI Server](#fastapi-server)
6. [Frontend Deep Dive](#frontend-deep-dive)
7. [Data Layer](#data-layer)
8. [Technology Stack](#technology-stack)
9. [Setup & Running](#setup--running)
10. [Environment Variables](#environment-variables)
11. [API Reference](#api-reference)
12. [Design Decisions & Trade-offs](#design-decisions--trade-offs)

---

## Project Overview

DegreeFYD is a web platform for Indian students seeking college and career guidance. This chatbot is the AI layer — a conversational assistant that can:

- Answer questions about **120,000+ knowledge base chunks** scraped from degreefyd.com
- Perform **structured lookups** from a SQLite database with 12,400 college comparison rows
- Run **live web searches** for fresh 2025/2026 data (cutoffs, fees, news)
- Maintain **conversation history** and resolve ambiguous follow-up questions
- Suggest **smart follow-up questions** after every answer
- Detect and redirect **counselling intent** to book a free session

---

## Key Features

| Feature | Details |
|---|---|
| ReAct Agent Loop | Up to 5 loops of Thought → Action → Observation → Final Answer |
| Parallel Tool Calls | Issues 2 tools simultaneously via `asyncio.gather()` |
| HyDE Retrieval | Hypothetical Document Embeddings improve semantic search accuracy |
| CRAG Filtering | Drops irrelevant chunks before sending to LLM |
| Cross-request Tool Cache | 500-entry LRU cache — identical tool calls never hit APIs twice |
| Query Rewriting | Ambiguous follow-ups ("what about its fees?") resolved to standalone questions |
| Follow-up Suggestions | 3 context-aware follow-up chips generated after every answer |
| Off-topic Guard | LLM classifier rejects non-education queries before the agent starts |
| Counselling Detector | Keyword-based intent detection → shows "Book Free Session" CTA |
| Category Context | Student's active tab (Colleges / Exams / Compare / Predictor) biases the agent |
| Dynamic Suggestion Pills | 25-question pool rotated randomly on each chat open |
| Live Web Search | Groq `compound-beta` model with built-in search — no scraping needed |
| Markdown Responses | Full table, bold, list support rendered in the frontend |
| Conversation Memory | Last N turns injected as context into every request |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + Vite)                    │
│                                                                     │
│  ChatBot.tsx                                                        │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │ Home Screen │  │ Chat Window      │  │ Category Cards         │ │
│  │ 25 rotating │  │ ReactMarkdown    │  │ Colleges / Exams /     │ │
│  │ suggestion  │  │ remark-gfm       │  │ Compare / Predictor    │ │
│  │ pills       │  │ Follow-up chips  │  │                        │ │
│  └─────────────┘  └──────────────────┘  └────────────────────────┘ │
│                            │ POST /chat                             │
└────────────────────────────┼────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                       FASTAPI BACKEND                               │
│                                                                     │
│  main.py  ─────►  Agent.run(query, history, category)              │
│                          │                                          │
│              ┌───────────▼────────────┐                            │
│              │    query_rewriter.py   │  llama-3.1-8b-instant      │
│              │  Resolve "what about   │  (fast, cheap rewrite)     │
│              │  its fees?" → full     │                            │
│              │  standalone question   │                            │
│              └───────────┬────────────┘                            │
│                          │                                          │
│              ┌───────────▼────────────┐                            │
│              │  Off-topic Guard       │  llama-3.1-8b-instant      │
│              │  + Counselling Check   │  (classifier)              │
│              └───────────┬────────────┘                            │
│                          │                                          │
│              ┌───────────▼────────────────────────────────────┐    │
│              │         ReAct Agent Loop (max 5 loops)         │    │
│              │                                                │    │
│              │  SYSTEM PROMPT + history + category context    │    │
│              │           │                                    │    │
│              │  ┌────────▼───────┐   llama-3.3-70b-versatile │    │
│              │  │  THOUGHT       │   (deep reasoning model)  │    │
│              │  │  ACTION: tool  │                            │    │
│              │  └────────┬───────┘                            │    │
│              │           │  asyncio.gather() for 2 tools      │    │
│              │  ┌────────▼───────────────────────────────┐   │    │
│              │  │           TOOL ROUTER                  │   │    │
│              │  │                                        │   │    │
│              │  │  ① search_vector_db ──► ChromaDB      │   │    │
│              │  │  ② search_sql_comparison ──► SQLite   │   │    │
│              │  │  ③ search_sql_exam ──► SQLite          │   │    │
│              │  │  ④ search_web ──► Groq compound-beta  │   │    │
│              │  └────────┬───────────────────────────────┘   │    │
│              │           │                                    │    │
│              │  OBSERVATION: [tool result injected]           │    │
│              │           │                                    │    │
│              │  ┌────────▼───────┐                            │    │
│              │  │  FINAL ANSWER  │  ← markdown response       │    │
│              │  └────────────────┘                            │    │
│              └────────────────────────────────────────────────┘    │
│                          │                                          │
│              ┌───────────▼────────────┐                            │
│              │ followup_generator.py  │  llama-3.1-8b-instant      │
│              │ Generate 3 follow-up   │  3 question chips          │
│              │ question suggestions   │                            │
│              └───────────┬────────────┘                            │
│                          │                                          │
│              Response: { answer, follow_ups, tools_used,           │
│                          rewritten_query, counselling_prompt }     │
└─────────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                         DATA LAYER                                  │
│                                                                     │
│  data/chroma_db/     ← 129,368 text chunks (degreefyd.com scrape)  │
│  data/degreefyd.db   ← SQLite: 12,400 college comparisons + exams  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
New Perfect Approach/
├── backend/
│   ├── .env                      # GROQ_API_KEY (not committed)
│   ├── main.py                   # FastAPI app, /chat endpoint, lifespan startup
│   ├── agent.py                  # ReAct agent — core reasoning loop
│   ├── model_loader.py           # Groq client wrapper (lazy init)
│   ├── query_rewriter.py         # Resolves ambiguous follow-up queries
│   ├── followup_generator.py     # Generates 3 follow-up chip suggestions
│   ├── groq_pool.py              # (unused) Multi-key Groq rotation — kept for future
│   └── tools/
│       ├── __init__.py
│       ├── vector_tools.py       # ChromaDB search + HyDE + CRAG
│       ├── sql_tools.py          # SQLite structured lookup (comparisons + exams)
│       └── web_tools.py          # Live web search via Groq compound-beta
│
├── data/
│   ├── chroma_db/                # ChromaDB persistent store (129,368 chunks)
│   └── degreefyd.db              # SQLite: comparisons (12,400 rows) + exams
│
└── Frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── src/
        ├── App.tsx               # Landing page + ChatBot integration
        ├── components/
        │   └── ChatBot.tsx       # Full chat widget (700 lines)
        ├── data/
        │   └── suggestions.json  # 25-question pool for rotating pills
        └── types.ts
```

---

## Backend Deep Dive

### ReAct Agent

`agent.py` is the core of the system. It implements the **ReAct (Reason + Act)** pattern without any frameworks — pure Python.

**The Loop:**

```python
# Simplified ReAct loop (agent.py)
async def _react_loop(self, messages: list) -> tuple[str, list]:
    tools_used = []

    for loop_num in range(self._MAX_LOOPS):
        # Call llama-3.3-70b-versatile — stop at OBSERVATION:
        response = self._client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            stop=["OBSERVATION:"],
            max_tokens=1024,
            temperature=0.2,
        )
        text = response.choices[0].message.content

        # Done?
        if "FINAL ANSWER:" in text:
            answer = text.split("FINAL ANSWER:")[-1].strip()
            return answer, tools_used

        # Parse all ACTION lines (supports 1-2 parallel tool calls)
        actions = _parse_all_actions(text)

        if not actions:
            break   # No tool call found — force fallback

        # Execute all tools in parallel
        obs_parts = await asyncio.gather(*[
            self._execute_tool(name, args) for name, args in actions
        ])

        # Inject observation back into message context
        observation = "\n\n".join(obs_parts)
        messages.append({
            "role": "assistant",
            "content": text
        })
        messages.append({
            "role": "user",
            "content": f"OBSERVATION:\n{observation}\n\nContinue your reasoning."
        })

    # Fallback: force a final answer if loop exhausted
    return await self._force_final_answer(messages), tools_used
```

**Cross-request Tool Cache:**

```python
# Every tool result is cached — same query never hits API twice
cache_key = f"{tool_name}:{json.dumps(args, sort_keys=True)}"
if cache_key in self._tool_cache:
    return self._tool_cache[cache_key]

result = await self._execute_tool_uncached(tool_name, args)

if len(self._tool_cache) >= self._CACHE_MAX:   # cap at 500
    oldest = next(iter(self._tool_cache))
    del self._tool_cache[oldest]

self._tool_cache[cache_key] = result
return result
```

**Parallel Tool Execution:**

The agent can issue two `ACTION:` lines in one loop. They are run simultaneously:

```
THOUGHT: I need both the structured comparison and KnowledgeBase details.
ACTION: search_sql_comparison("IIT Bombay vs IIT Delhi")
ACTION: search_vector_db("IIT Bombay IIT Delhi placements campus life")
OBSERVATION:  ← system fills this — STOP
```

---

### Tool 1 — Vector Search (ChromaDB + HyDE + CRAG)

`vector_tools.py` implements a 3-stage retrieval pipeline:

#### Stage 1 — HyDE (Hypothetical Document Embeddings)

Instead of embedding the raw question, we first generate a "hypothetical answer" and embed that. This closes the semantic gap between question-space and document-space.

```python
def _generate_hyde_query(query: str) -> str:
    """
    Generate a 2-sentence hypothetical answer using llama-3.1-8b-instant (temp=0).
    Then embed this answer instead of the question.
    """
    resp = _get_groq_client().chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an Indian college and exam information database. "
                    "Write a concise 2-sentence factual passage that directly answers the question. "
                    "Include specific numbers, names, and facts as if from an official source. "
                    "Output ONLY the passage, nothing else."
                ),
            },
            {"role": "user", "content": query},
        ],
        temperature=0,    # deterministic — same query → same HyDE → same embedding
        max_tokens=100,
    )
    return resp.choices[0].message.content.strip()
```

**Example:**
- Raw query: `"What are the fees at IIT Bombay?"`
- HyDE output: `"IIT Bombay charges approximately ₹2.2 lakh per year for BTech programmes. The total 4-year fee including hostel is around ₹10–12 lakh for general category students."`
- This HyDE text is embedded and used to search ChromaDB — much better match than the raw question.

#### Stage 2 — ChromaDB Retrieval

```python
collection.query(
    query_texts=[hyde_text],   # embed the hypothetical answer, not the raw query
    n_results=5,
    where={"type": doc_type} if doc_type else None,   # optional category filter
)
```

- **129,368 chunks** from degreefyd.com
- **Embedding model**: `sentence-transformers/all-MiniLM-L6-v2` (384-dim, L2 distance)
- **Metadata fields**: `url`, `type` (college/comparison/exam/blog/course), `college_names`, `exam_names`

#### Stage 3 — CRAG (Corrective RAG) Filtering

After retrieval, irrelevant chunks are dropped using keyword overlap:

```python
def _crag_filter(query: str, docs: list[str]) -> list[str]:
    """
    Drop chunks that share zero keyword overlap with the query.
    Falls back to all chunks if none pass (prevents empty retrieval).
    """
    keywords = set(re.findall(r'\b[a-zA-Z]{3,}\b', query.lower()))
    # Remove common stop words
    stop_words = {"what", "which", "where", "when", "how", "the", "for", ...}
    keywords -= stop_words

    filtered = [
        doc for doc in docs
        if keywords & set(re.findall(r'\b[a-zA-Z]{3,}\b', doc.lower()))
    ]
    return filtered if filtered else docs   # fallback: return all if all filtered out
```

---

### Tool 2 — SQL Comparison Lookup

`sql_tools.py` queries a SQLite table with **12,400 college comparison rows**.

```python
def search_sql_comparison(college1: str, college2: str) -> str:
    cursor.execute(
        """
        SELECT * FROM comparisons
        WHERE (college_1 LIKE ? AND college_2 LIKE ?)
           OR (college_1 LIKE ? AND college_2 LIKE ?)
        LIMIT 1
        """,
        (f"%{college1}%", f"%{college2}%", f"%{college2}%", f"%{college1}%"),
    )
    # Returns a formatted markdown table: fees, NIRF rank, courses, year, type, rating
```

**Table schema (comparisons):**

| Column | Example |
|---|---|
| `college_1` | IIT Bombay |
| `college_2` | IIT Delhi |
| `college_1_fees` | 2,20,000 |
| `college_1_nirf` | 3 |
| `college_1_courses` | BTech, MTech, PhD |
| `college_1_year` | 1958 |
| `college_1_type` | Public |
| `college_1_rating` | 4.2 |

> **Note:** Some rows have data quality issues (truncated fees, incorrect NIRF). The agent's system prompt instructs the LLM to cross-verify SQL figures against its training knowledge.

---

### Tool 3 — SQL Exam Lookup

```python
def search_sql_exam(exam_name: str) -> str:
    cursor.execute(
        """
        SELECT * FROM exams
        WHERE exam_name LIKE ?
        ORDER BY LENGTH(exam_name) ASC
        LIMIT 3
        """,
        (f"%{exam_name}%",),
    )
    # Returns: exam dates, conducting body, mode, duration, eligibility
```

---

### Tool 4 — Live Web Search

`web_tools.py` uses Groq's `compound-beta` model which has **built-in web search** — no HTML scraping, no rate limits, no CAPTCHAs.

```python
def search_web(query: str) -> str:
    resp = client.chat.completions.create(
        model="compound-beta",    # Groq's model with native web search
        messages=[
            {"role": "system", "content": "Indian higher education research assistant..."},
            {"role": "user", "content": query},
        ],
        max_tokens=1024,
    )
    # compound-beta internally decides when to search and synthesizes results
    # Executed tool citations (URLs) are extracted and appended to the response
```

The agent is instructed to use `search_web` **only as a last resort** — it is slower and consumes more tokens. Preference is: `vector_db` → `sql` → `search_web`.

---

### Query Rewriter

`query_rewriter.py` uses `llama-3.1-8b-instant` to resolve ambiguous follow-up queries.

**The problem it solves:**
```
Turn 1 → User: "Tell me about IIT Bombay"
Turn 2 → User: "what about its fees?"
         ↑ "its" is ambiguous without context
```

**The fix:**
```python
def _is_ambiguous(query: str) -> bool:
    """Check for pronouns and references that need context to resolve."""
    _AMBIGUOUS_SIGNALS = [
        " it ", " its ", " their ", " there ", " that ", " this ",
        "both", "the college", "compare them", "fees there",
        "tell me more", "what about", "which one", "which is better", ...
    ]
    return any(signal in f" {query.lower()} " for signal in _AMBIGUOUS_SIGNALS)


def rewrite_query(query: str, history: List[Dict]) -> str:
    if not history or not _is_ambiguous(query):
        return query   # Skip if clearly standalone

    # Send last 3 turns + ambiguous query to llama-3.1-8b-instant
    # Output: "What are the fees at IIT Bombay?"
```

---

### Follow-up Generator

`followup_generator.py` — after every bot answer, generates 3 contextually relevant follow-up chips using `llama-3.1-8b-instant`.

```python
def generate_followups(question: str, answer: str) -> List[str]:
    short_answer = answer[:400]   # Truncate to save tokens

    resp = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "Suggest 3 follow-up questions as a JSON array..."},
            {"role": "user", "content": f"Student asked: {question}\nBot answered: {short_answer}"},
        ],
        max_tokens=120,
        temperature=0.7,
    )
    # Parses JSON array from response → ["What is the hostel fee?", "Compare with IIT Delhi", ...]
```

---

### Off-topic Guard

Before running the expensive ReAct loop, a fast LLM call checks if the query is genuinely education-related:

```python
def _is_off_topic(query: str) -> bool:
    """
    Rejects: "what is jee advance donald trump meaning?"
    Accepts: "JEE Main 2026 dates?"

    Fails OPEN — on any API error, returns False (allows the query through).
    """
```

If off-topic, the agent immediately returns a brief refusal without touching ChromaDB, SQLite, or the main reasoning model.

---

### Counselling Intent Detector

```python
_COUNSELLING_KEYWORDS = [
    "counselling", "counseling", "book a session", "talk to advisor",
    "free session", "career guidance", "expert advice", "connect me", ...
]

def _is_counselling_intent(query: str) -> bool:
    return any(kw in query.lower() for kw in _COUNSELLING_KEYWORDS)
```

If triggered, the response includes `counselling_prompt: true` and the frontend renders a "Book Free Counselling Session" CTA button.

---

### FastAPI Server

`main.py` — the HTTP layer.

```python
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if _agent is None:
        raise HTTPException(503, "Agent not ready")

    result = await _agent.run(
        query=req.message,
        history=req.history,
        category=req.category,
        mode=req.mode,
    )
    follow_ups = generate_followups(
        question=result.get("rewritten_query", req.message),
        answer=result["answer"],
    )
    return ChatResponse(
        answer=result["answer"],
        follow_ups=follow_ups,
        rewritten_query=result.get("rewritten_query"),
        tools_used=result.get("tools_used", []),
        counselling_prompt=result.get("counselling_prompt", False),
    )
```

**Request/Response:**

```jsonc
// POST /chat
{
  "message": "Compare IIT Bombay and IIT Delhi fees",
  "history": [
    {"role": "user", "content": "Tell me about IIT Bombay"},
    {"role": "assistant", "content": "IIT Bombay is..."}
  ],
  "category": "Compare",   // optional — injects category context
  "mode": "detailed"       // "concise" | "detailed"
}

// Response
{
  "answer": "### IIT Bombay vs IIT Delhi\n\n| Parameter | IIT Bombay | ...",
  "follow_ups": ["What about hostel fees?", "Which has better placements?", ...],
  "rewritten_query": "Compare IIT Bombay and IIT Delhi fees",
  "tools_used": ["search_sql_comparison", "search_vector_db"],
  "counselling_prompt": false
}
```

---

## Frontend Deep Dive

`ChatBot.tsx` (673 lines) is a self-contained React component that manages the entire chat experience.

### Dynamic Suggestion Pills

On initial load and every time the chat is closed, 4 random questions are picked from a 25-question pool:

```tsx
import SUGGESTION_POOL from "../data/suggestions.json";  // 25 questions

function pickRandom(arr: string[], n: number): string[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

const [dynamicPills, setDynamicPills] = useState(() =>
  pickRandom(SUGGESTION_POOL, 4)
);

const handleClose = () => {
  setIsOpen(false);
  setDynamicPills(pickRandom(SUGGESTION_POOL, 4));  // reshuffle on close
};
```

### Message Rendering

All bot responses are rendered as Markdown with table support:

```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}   // GitHub Flavored Markdown — enables tables
  components={{
    table: ({ children }) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    // ... custom styling for th, td, code, a, ul, ol
  }}
>
  {message.text}
</ReactMarkdown>
```

### Category Cards

The home screen shows 4 category cards (Colleges, Exams, Compare, Predictor), each with tabbed example questions. Clicking a question sends it directly to the agent with the category label attached.

### Conversation History Tracking

```tsx
const [history, setHistory] = useState<HistoryTurn[]>([]);

// On each message send:
setHistory(prev => [
  ...prev,
  { role: "user", content: userMessage },
  { role: "assistant", content: botResponse },
]);

// Sent to backend as part of every request
const payload = {
  message: input,
  history,         // full conversation context
  category,
  mode,
};
```

---

## Data Layer

### ChromaDB (Vector Store)

| Property | Value |
|---|---|
| Total chunks | 129,368 |
| Embedding model | `sentence-transformers/all-MiniLM-L6-v2` |
| Dimensions | 384 |
| Distance metric | L2 |
| Results per query | 5 (after CRAG filter) |
| Chunk types | college, comparison, exam, blog, course |
| Source | degreefyd.com (scraped) |

### SQLite Database

**`comparisons` table** (12,400 rows):
- college_1, college_2, college_1_fees, college_2_fees
- college_1_nirf, college_2_nirf
- college_1_courses, college_2_courses
- college_1_year, college_2_year
- college_1_type, college_2_type
- college_1_students, college_2_students
- college_1_rating, college_2_rating

**`exams` table**:
- exam_name, conducting_body, exam_mode, duration
- application_start, application_end, exam_date
- eligibility criteria

---

## Technology Stack

### Backend

| Library | Version | Purpose |
|---|---|---|
| `fastapi` | latest | HTTP API server |
| `uvicorn` | latest | ASGI server |
| `pydantic` | v2 | Request/response validation |
| `groq` | latest | LLM inference (llama-3.3-70b, llama-3.1-8b, compound-beta) |
| `chromadb` | 0.4.x | Vector database for 129k chunks |
| `sentence-transformers` | latest | `all-MiniLM-L6-v2` embeddings |
| `python-dotenv` | latest | `.env` loading |
| `asyncio` | stdlib | Parallel async tool execution |
| `sqlite3` | stdlib | Structured data queries |
| `re` | stdlib | Action parsing from LLM output |

### Frontend

| Library | Version | Purpose |
|---|---|---|
| `react` | 18 | UI framework |
| `vite` | 5 | Build tool + dev server |
| `typescript` | 5 | Type safety |
| `tailwindcss` | 3 | Utility CSS |
| `shadcn/ui` | latest | Radix-based component library |
| `react-markdown` | latest | Render bot responses as Markdown |
| `remark-gfm` | latest | GitHub Flavored Markdown (tables, strikethrough) |
| `lucide-react` | latest | Icon set |
| `@tanstack/react-query` | 5 | Data fetching |

### LLM Models Used

| Model | Provider | Used For |
|---|---|---|
| `llama-3.3-70b-versatile` | Groq | ReAct reasoning, final answer generation |
| `llama-3.1-8b-instant` | Groq | HyDE query generation, query rewriting, follow-up generation, off-topic classification |
| `compound-beta` | Groq | Live web search with built-in internet access |

---

## Setup & Running

### Prerequisites

- Python 3.10+
- Node.js 18+ (or Bun)
- A Groq API key — [get one free at console.groq.com](https://console.groq.com)

### Backend

```bash
cd "New Perfect Approach/backend"

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install fastapi uvicorn groq chromadb sentence-transformers python-dotenv

# Create .env file
echo GROQ_API_KEY=your_key_here > .env

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd "New Perfect Approach/Frontend"

# Install dependencies
npm install       # or: bun install

# Start dev server
npm run dev       # or: bun dev
# Opens at http://localhost:5173
```

### Data (required)

You need the two data files locally — they are not committed to git (too large).

```
New Perfect Approach/
└── data/
    ├── chroma_db/       ← ChromaDB folder (from original scrape)
    └── degreefyd.db     ← SQLite file (from extract_to_sqlite.py)
```

---

## Environment Variables

```bash
# backend/.env
GROQ_API_KEY=gsk_...   # Required — get from console.groq.com
```

Only one key is required. The project has a `groq_pool.py` file for multi-key rotation if needed in production (currently unused).

---

## API Reference

### `POST /chat`

**Request:**
```json
{
  "message": "string (required) — the student's question",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "category": "Colleges | Exams | Compare | Predictor (optional)",
  "mode": "concise | detailed (optional, default: detailed)"
}
```

**Response:**
```json
{
  "answer": "string — full markdown response",
  "follow_ups": ["string", "string", "string"],
  "rewritten_query": "string — resolved standalone version of the query",
  "tools_used": ["search_vector_db", "search_sql_comparison"],
  "counselling_prompt": false
}
```

### `GET /health`

Returns `{"status": "ok"}` — used to verify the server is running.

---

## Design Decisions & Trade-offs

### Why ReAct instead of a simple RAG pipeline?

Simple RAG (embed → retrieve → answer) fails for:
- College comparisons (need both vector + SQL data combined)
- Latest 2025 cutoffs (need live web search)
- Multi-part questions ("fees, placement, and cutoff at VIT?")

ReAct lets the agent **decide** what tool to call based on reasoning, and can combine multiple data sources in one answer.

### Why HyDE?

Direct question embedding (`"what are the fees at IIT?"`) often matches question-style text in the knowledge base ("what is the fee?") rather than answer-style text ("the annual fee is ₹2.2 lakh"). HyDE generates an answer-style passage first, so the embedding lands much closer to real answer documents.

### Why CRAG?

Top-5 ChromaDB results often include tangentially related chunks (e.g., query about "IIT Bombay fees" retrieves a chunk about "IIT Bombay sports facilities"). CRAG's keyword filter removes these before they waste the LLM's context window.

### Why two LLMs?

- `llama-3.3-70b-versatile` — heavy reasoning, complex synthesis, final answer quality
- `llama-3.1-8b-instant` — fast, cheap helper calls: HyDE (50ms), rewrite (80ms), follow-ups (100ms)

This keeps the overall latency reasonable: heavy model only runs for the main ReAct loop.

### Why Groq compound-beta for web search?

Alternatives like Google Search API require paid keys + HTML parsing. DuckDuckGo scraping breaks constantly. `compound-beta` is a single Groq API call that handles everything internally — much simpler and more reliable.

### Cross-request Tool Cache

If a student asks "IIT Bombay fees" in turn 1 and then "IIT Bombay vs IIT Delhi" in turn 3, the IIT Bombay vector search in turn 3 reuses the cached result from turn 1. Cache is capped at 500 entries using a simple FIFO eviction strategy.

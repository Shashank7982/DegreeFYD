"""
main.py
=======
FastAPI backend for the DegreeFYD ReAct agent.

Fixes applied:
  - Single agent initialization via lifespan (was initialized twice)
  - @app.on_event deprecated → replaced with contextlib lifespan
  - history is now forwarded to agent.run() (was silently dropped)
  - Response includes rewritten_query and tools_used for frontend transparency
"""

import logging
import re
from contextlib import asynccontextmanager
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

from agent import Agent
from followup_generator import generate_followups

# ── Lifespan: initialize heavy resources once at startup ──────────────────────

_agent: Agent = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _agent
    print("[Startup] Loading models and vector store...")

    # Pre-load ChromaDB + embedding model
    from tools.vector_tools import get_collection
    get_collection()

    # Initialize agent (loads Groq client + optional local Qwen)
    _agent = Agent()

    print("[Startup] System ready.")
    yield
    # Cleanup (nothing needed here)
    print("[Shutdown] Goodbye.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="DegreeFYD Agent API",
    description="Conversational ReAct agent for Indian college counseling",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Restrict to ["http://localhost:5173"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []
    mode: str = "detailed"        # "detailed" | "concise"
    web_search: bool = False      # True → agent uses search_web first
    category: str = ""            # active home-screen tab: Colleges/Exams/Compare/Predictor

    @field_validator("message")
    @classmethod
    def message_not_too_long(cls, v: str) -> str:
        v = v.strip()
        if len(v) > 2000:
            raise ValueError("Message too long — please keep it under 2000 characters.")
        if not v:
            raise ValueError("Message cannot be empty.")
        return v


class ChatResponse(BaseModel):
    response: str
    rewritten_query: str
    tools_used: List[str]
    follow_ups: List[str]   # 3 suggested follow-up questions for the frontend chips
    counselling_prompt: bool = False  # True → frontend shows phone+email form


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"status": "ok", "message": "DegreeFYD Agent v2 Active"}


@app.get("/health")
def health():
    from tools.vector_tools import _collection, _chroma_error
    return {
        "status": "ok",
        "vector_db": "loaded" if _collection else f"error: {_chroma_error}",
        "agent": "ready" if _agent else "not initialized",
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint.
    Accepts user message + conversation history.
    Runs ReAct agent loop and returns final answer.
    """
    if _agent is None:
        raise HTTPException(status_code=503, detail="Agent not initialized yet. Try again in a moment.")

    try:
        # #4 + #22: trim to last 8 turns; truncate long assistant turns to 300 chars
        raw_history = (request.history or [])[-8:]
        trimmed_history = [
            {**t, "content": t["content"][:300]}
            if t.get("role") == "assistant" and len(t.get("content", "")) > 300
            else t
            for t in raw_history
        ]

        result = await _agent.run(
            user_query=request.message,
            history=trimmed_history,
            mode=request.mode,
            web_search=request.web_search,
            category=request.category,
        )

        # #16: strip inline citation numbers like [1] [2] from web search results
        clean_answer = re.sub(r"\s*\[\d+\]", "", result["answer"]).strip()

        # Follow-up chips: agent now embeds them in the answer; fallback to generator if absent
        if result.get("follow_ups"):
            followups = result["follow_ups"]
        else:
            followups = generate_followups(
                question=result["rewritten_query"],
                answer=clean_answer,
            )

        return ChatResponse(
            response=clean_answer,
            rewritten_query=result["rewritten_query"],
            tools_used=result["tools_used"],
            follow_ups=followups,
            counselling_prompt=result.get("counselling_prompt", False),
        )
    except Exception as e:
        logging.exception("Error in /chat endpoint")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

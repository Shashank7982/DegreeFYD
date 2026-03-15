"""
vector_tools.py
===============
ChromaDB vector search tool.

Fixes applied:
  - Catches ChromaDB version-mismatch PanicException (BaseException)
  - Uses correct metadata keys: 'url', 'type', 'college_names', 'exam_names'
  - Supports doc_type filtering (college/comparison/exam/blog/course)
  - Lightweight CRAG relevance check — drops chunks with zero keyword overlap

ChromaDB version note:
  The existing DB was written by an older chromadb. If you see a Rust panic on
  startup, pin chromadb in requirements: `pip install chromadb==0.4.24`
  and then re-activate. Alternatively delete data/chroma_db and re-run ingest.
"""

import os
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path
from typing import Optional
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # New Perfect Approach/
CHROMA_DB_PATH = BASE_DIR / "data" / "chroma_db"
COLLECTION_NAME = "degreefyd_docs"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

_client = None
_collection = None
_embedding_fn = None
_chroma_error = None  # cached startup error so we don't re-try every call
_groq_client = None   # lazy init for HyDE


def _get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _groq_client


def _generate_hyde_query(query: str) -> str:
    """
    HyDE — Hypothetical Document Embeddings.

    Generates a short 2-sentence passage that *answers* the query as if it
    were a snippet from an Indian college/exam knowledge base.  Embedding this
    hypothetical answer instead of the raw question closes the semantic gap
    between question-space and document-space, improving retrieval accuracy.

    Falls back to the original query on any error.
    """
    try:
        resp = _get_groq_client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an Indian college and exam information database. "
                        "Write a concise 2-sentence factual passage that directly answers the question. "
                        "Include specific numbers, names, and facts as if from an official source. "
                        "Do NOT ask follow-up questions. Output ONLY the passage, nothing else."
                    ),
                },
                {"role": "user", "content": query},
            ],
            temperature=0,
            max_tokens=100,
        )
        hyde_text = resp.choices[0].message.content.strip()
        print(f"[HyDE] Generated: {hyde_text[:100]}...")
        return hyde_text if hyde_text else query
    except Exception as e:
        print(f"[HyDE] Fallback to raw query (error: {e})")
        return query


def get_collection():
    global _client, _collection, _embedding_fn, _chroma_error

    if _collection is not None:
        return _collection

    if _chroma_error is not None:
        return None  # already failed — don't retry

    try:
        if not CHROMA_DB_PATH.exists():
            _chroma_error = f"ChromaDB path not found: {CHROMA_DB_PATH}"
            print(f"[VectorTools] WARNING: {_chroma_error}")
            return None

        print(f"[VectorTools] Loading ChromaDB from: {CHROMA_DB_PATH}")

        _embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL_NAME
        )
        _client = chromadb.PersistentClient(path=str(CHROMA_DB_PATH))
        _collection = _client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=_embedding_fn,
        )
        print(f"[VectorTools] Collection loaded: {_collection.count()} chunks")
        return _collection

    except BaseException as e:
        # BaseException catches pyo3_runtime.PanicException (chromadb version mismatch)
        _chroma_error = str(e)
        print(
            f"[VectorTools] ERROR loading ChromaDB: {e}\n"
            "  FIX: pin chromadb version — pip install chromadb==0.4.24 — "
            "then delete data/chroma_db and re-run: python scripts/ingest_data.py"
        )
        return None


def _crag_filter(documents: list, metadatas: list, query: str) -> list:
    """
    Lightweight CRAG relevance filter.
    Extracts key nouns from the query and drops chunks that contain none of them.
    Returns list of (doc, meta) tuples that pass the relevance check.
    """
    # Extract meaningful words (length > 3, skip stop words)
    stop = {"what", "when", "where", "which", "does", "have", "about", "tell",
            "give", "show", "best", "good", "with", "from", "that", "this"}
    keywords = [
        w.lower() for w in query.split()
        if len(w) > 3 and w.lower() not in stop
    ]
    if not keywords:
        return list(zip(documents, metadatas))  # no keywords → keep everything

    relevant = []
    for doc, meta in zip(documents, metadatas):
        doc_lower = doc.lower()
        if any(kw in doc_lower for kw in keywords):
            relevant.append((doc, meta))

    # If CRAG drops everything, fall back to all results (better than nothing)
    return relevant if relevant else list(zip(documents, metadatas))


def search_vectors(query: str, n_results: int = 5, doc_type: Optional[str] = None) -> str:
    """
    Search ChromaDB for relevant chunks using HyDE.

    Args:
        query:     Natural language search query
        n_results: Number of chunks to retrieve (before CRAG filtering)
        doc_type:  Optional filter — 'college' | 'comparison' | 'exam' | 'blog' | 'course'

    Returns:
        Formatted string of relevant chunks for the LLM to read.
    """
    col = get_collection()
    if col is None:
        return (
            "Vector Database is not available right now. "
            "Please use web search or SQL tools instead."
        )

    try:
        where_filter = {"type": doc_type} if doc_type else None

        # HyDE: embed a hypothetical answer instead of the raw question
        search_text = _generate_hyde_query(query)

        results = col.query(
            query_texts=[search_text],
            n_results=n_results,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        if not documents:
            return "No relevant documents found in the knowledge base."

        # CRAG: drop irrelevant chunks
        filtered = _crag_filter(documents, metadatas, query)

        output = "### Context from Knowledge Base:\n"
        for i, (doc, meta) in enumerate(filtered, 1):
            url = meta.get("url", "") if meta else ""
            dtype = meta.get("type", "") if meta else ""
            label = f"[{dtype}] {url}" if url else dtype
            output += f"{i}. {doc.strip()}\n"
            if label:
                output += f"   *(Source: {label})*\n"
            output += "\n"

        return output

    except BaseException as e:
        return f"Vector search error: {e}"


# Test
if __name__ == "__main__":
    print(search_vectors("Is Amity University good for MBA?"))
    print(search_vectors("JEE Main 2025 dates", doc_type="exam"))

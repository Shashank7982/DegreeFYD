from duckduckgo_search import DDGS
import time

print("Testing DuckDuckGo Search...")

try:
    print("Attempt 1: Context Manager")
    with DDGS() as ddgs:
        results = list(ddgs.text("python programming", max_results=3))
        print(f"Results found: {len(results)}")
        for r in results:
            print(f"- {r['title']}")

except Exception as e:
    print(f"Attempt 1 Failed: {e}")

try:
    print("\nAttempt 2: Direct Instantiation")
    ddgs = DDGS()
    results = list(ddgs.text("python programming", max_results=3))
    print(f"Results found: {len(results)}")
    for r in results:
        print(f"- {r['title']}")

except Exception as e:
    print(f"Attempt 2 Failed: {e}")

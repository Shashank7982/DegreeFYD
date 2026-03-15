import requests
import traceback

print("--- DIAGNOSTIC START ---")

try:
    print("Testing 'googlesearch' Library...")
    from googlesearch import search
    results_gen = search("LPU University", num_results=1, advanced=True)
    for res in results_gen:
        print(f"GOOGLE SUCCESS: {res.title}")
    print("GOOGLE DONE.")
except ImportError:
    print("GOOGLE FAIL: Module 'googlesearch' (googlesearch-python) not found.")
except Exception as e:
    print(f"GOOGLE FAIL: {e}")
    traceback.print_exc()

print("\nTesting 'duckduckgo_search' Library...")
try:
    from duckduckgo_search import DDGS
    with DDGS() as ddgs:
        ddg_gen = ddgs.text("LPU University", max_results=1)
        if ddg_gen:
            print(f"DDGS SUCCESS: Found {len(list(ddg_gen))} results")
        else:
            print("DDGS NO RESULTS.")
except ImportError:
    print("DDGS FAIL: Module 'duckduckgo_search' not found.")
except Exception as e:
    print(f"DDGS FAIL: {e}")
    traceback.print_exc()

print("\nTesting 'Manual Request Fallback'...")
try:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    payload = {'q': "LPU University"}
    response = requests.post("https://html.duckduckgo.com/html", data=payload, headers=headers, timeout=10)
    print(f"MANUAL STATUS: {response.status_code}")
    print(f"MANUAL PREVIEW: {response.text[:200]}")
except Exception as e:
    print(f"MANUAL FAIL: {e}")

print("--- DIAGNOSTIC END ---")

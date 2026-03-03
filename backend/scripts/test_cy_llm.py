import sys
import os
import asyncio

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.cy_service import cy_service

async def test_cy_llm():
    print("--- Testing Cy LLM Integration ---")
    
    query = "How does the phishing analyzer work?"
    print(f"Query: {query}")
    
    # 1. Retrieve Context
    print("Step 1: Retrieving context...")
    docs = cy_service.search_context(query)
    print(f"Found {len(docs)} relevant documents.")
    
    # 2. Generate Response
    print("Step 2: Generating response from Gemini...")
    try:
        response = await cy_service.generate_response(query, docs, {"path": "/dashboard"})
        print("\n--- Cy's Response ---")
        print(response)
        print("---------------------")
        
        if "I'm having trouble connecting" in response:
            print("FAILURE: LLM connection issue.")
        else:
            print("SUCCESS: LLM responded.")
            
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_cy_llm())

import sys
import os
import asyncio

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.cy_service import cy_service

async def ingest_sample_content():
    print("--- Starting Content Ingestion ---")
    
    sample_docs = [
        {
            "content": "CodeLife is an advanced cybersecurity training platform. It features interactive labs, a phishing analyzer, and an AI tutor named Cy.",
            "metadata": {"title": "About CodeLife", "type": "overview"}
        },
        {
            "content": "To start a lab, navigate to the Dashboard and click on 'Start Lab'. You will be given a Docker-based terminal environment.",
            "metadata": {"title": "How to Start a Lab", "type": "guide"}
        },
        {
            "content": "Phishing detection uses an ensemble of TF-IDF, Logistic Regression, SVM, and DistilBERT to analyze emails for suspicious signals.",
            "metadata": {"title": "Phishing Analyzer Logic", "type": "technical"}
        }
    ]

    for doc in sample_docs:
        print(f"Ingesting: {doc['metadata']['title']}")
        cy_service.add_document(doc["content"], doc["metadata"])
    
    print("--- Ingestion Complete ---")
    
    # Verify
    print("\n--- Verifying Retrieval ---")
    query = "How does the phishing analyzer work?"
    results = cy_service.search_context(query)
    for r in results:
        print(f"Found: {r.metadata['title']} \nContent: {r.page_content[:50]}...")

if __name__ == "__main__":
    # ChromaDB operations are synchronous in this setup, so we can just run the function
    # But if we had async DB ops, we'd need asyncio.run
    asyncio.run(ingest_sample_content())

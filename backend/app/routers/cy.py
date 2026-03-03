from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.cy_service import cy_service

router = APIRouter(prefix="/cy", tags=["cy-tutor"])

class ChatRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = {}

class KnowledgeDocument(BaseModel):
    content: str
    metadata: Dict[str, Any]

@router.post("/chat")
async def chat_with_cy(request: ChatRequest):
    """
    Chat endpoint for Cy Tutor.
    Retrieves context and generates a response.
    """
    try:
        # Retrieve context
        relevant_docs = cy_service.search_context(request.query)
        
        # Generate response (streaming TODO)
        response_text = await cy_service.generate_response(request.query, relevant_docs, request.context)
        
        return {
            "response": response_text,
            "sources": [{"content": d.page_content[:100], "metadata": d.metadata} for d in relevant_docs]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest")
async def ingest_knowledge(doc: KnowledgeDocument):
    """
    ingest a document into the knowledge base.
    """
    try:
        cy_service.add_document(doc.content, doc.metadata)
        return {"status": "success", "message": "Document ingested"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history():
    # Placeholder for chat history
    return []

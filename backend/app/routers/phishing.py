from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from app.services.phishing_service import phishing_service
from typing import Dict, Any, Optional

router = APIRouter(prefix="/phishing", tags=["Phishing Analyzer"])

class PhishingRequest(BaseModel):
    email_text: str = Field(..., max_length=50000, description="The text of the email or message to analyze")
    strip_html: bool = Field(True, description="Whether to strip HTML tags before analysis")

@router.post("/analyze")
async def analyze_phishing(request: PhishingRequest = Body(...)):
    """
    Analyze the provided email text for phishing indicators using an ensemble model.
    """
    if not request.email_text.strip():
        raise HTTPException(status_code=400, detail="email_text cannot be empty")
        
    try:
        result = phishing_service.analyze_email(request.email_text, strip_html=request.strip_html)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal analysis error: {str(e)}")

@router.get("/status")
async def get_model_status():
    """
    Check the current status of the phishing analyzer model.
    """
    return {
        "model_status": "placeholder" if phishing_service.placeholder_mode else "production",
        "models_available": {
            "tfidf": phishing_service.vectorizer is not None,
            "logreg": phishing_service.logreg is not None,
            "svm": phishing_service.svm is not None,
            "distilbert": phishing_service.bert_model is not None
        }
    }

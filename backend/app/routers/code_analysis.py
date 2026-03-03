from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, Any, List
from app.services.code_analysis_service import code_analysis_service

router = APIRouter(prefix="/analysis", tags=["analysis"])

class AnalyzeCodeRequest(BaseModel):
    code: str
    language: str = "python"

@router.post("/scan")
async def analyze_code(request: AnalyzeCodeRequest):
    """
    Analyze code for security vulnerabilities.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
        
    try:
        result = code_analysis_service.analyze_code(request.code, request.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.pqc_service import pqc_service
from app.services.pqc_scoring_engine import pqc_scoring_engine

router = APIRouter(prefix="/pqc", tags=["pqc"])

class BenchmarkRequest(BaseModel):
    algorithm: str
    user_id: str

class ScoreRequest(BaseModel):
    user_id: str
    score_delta: int

@router.post("/execute/kyber")
async def execute_kyber_demo():
    result = pqc_service.run_kyber_demo()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Execution failed"))
    return result.get("data")

@router.post("/execute/dilithium")
async def execute_dilithium_demo():
    result = pqc_service.run_dilithium_demo()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Execution failed"))
    return result.get("data")

@router.post("/benchmark")
async def execute_benchmark(request: BenchmarkRequest):
    result = pqc_service.run_benchmark(request.algorithm)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Benchmark failed"))
    
    # Track the benchmark in Firestore
    data = result.get("data", {})
    if data:
        pqc_scoring_engine.record_benchmark(request.user_id, data)
        
    return data

@router.post("/score")
async def submit_challenge_score(request: ScoreRequest):
    result = pqc_scoring_engine.submit_challenge_score(request.user_id, {"score_delta": request.score_delta})
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Score submission failed"))
    return result

@router.post("/complete")
async def complete_pqc_module(request: ScoreRequest): # Using ScoreRequest to get user_id easily
    result = pqc_scoring_engine.mark_module_completed(request.user_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Completion failed"))
    return result


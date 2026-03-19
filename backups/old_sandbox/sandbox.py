from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.sandbox_service import sandbox_service, SandboxService

router = APIRouter(prefix="/sandbox", tags=["sandbox"])

class StartLabRequest(BaseModel):
    user_id: str
    lab_id: str

@router.post("/start")
async def start_lab(request: StartLabRequest):
    """
    Start a new lab session.
    """
    if not sandbox_service.is_available():
        raise HTTPException(status_code=503, detail="Sandbox service unavailable (Docker not connected)")
        
    try:
        result = sandbox_service.start_lab(request.user_id, request.lab_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop/{container_id}")
async def stop_lab(container_id: str):
    """
    Stop a running lab session.
    """
    try:
        sandbox_service.stop_lab(container_id)
        return {"status": "stopped", "container_id": container_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def check_status():
    """
    Check if Docker service is available.
    """
    return {
        "available": sandbox_service.is_available(),
        "backend": "docker"
    }

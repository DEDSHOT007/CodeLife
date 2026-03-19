from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import logging
import asyncio

# Import your sandbox service (we'll update this next)
from app.services.sandbox_service import SandboxManager
from app.firestore_db import get_firestore_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sandbox", tags=["sandbox"])

# Initialize sandbox manager
sandbox_manager = SandboxManager()

# Request/Response Models
class StartSandboxRequest(BaseModel):
    user_id: str
    scenario_id: str

class ExtendTimeRequest(BaseModel):
    hours: int = 2
    

# Endpoints

@router.get("/scenarios")
async def get_scenarios():
    """
    Get list of all available sandbox scenarios.
    Returns scenario metadata without launching anything.
    """
    try:
        scenarios = sandbox_manager.get_available_scenarios()
        return {
            "scenarios": [
                {
                    "id": s["id"],
                    "name": s["name"],
                    "description": s["description"],
                    "difficulty": s["difficulty"],
                    "categories": s["categories"],
                    "estimated_time": s["estimated_time"],
                    "challenges": len(s.get("challenges", []))
                }
                for s in scenarios
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get scenarios: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve scenarios: {str(e)}")


@router.get("/scenarios/{scenario_id}")
async def get_scenario_details(scenario_id: str):
    """
    Get detailed information about a specific scenario including challenges.
    """
    try:
        scenario = sandbox_manager.get_scenario_by_id(scenario_id)
        if not scenario:
            raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
        return scenario
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get scenario {scenario_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/launch")
async def launch_sandbox(
    request: StartSandboxRequest
):
    """
    Launch a new sandbox environment for the user.
    Creates a Docker container running the vulnerable web application.
    """
    # Check if Docker is available
    if not sandbox_manager.is_docker_available():
        raise HTTPException(
            status_code=503, 
            detail="Docker service is unavailable. Please ensure Docker is running on the server."
        )
    
    try:
        # Get Firestore client
        db = get_firestore_client()
        
        # Launch the sandbox
        sandbox_info = await sandbox_manager.launch_sandbox(
            user_id=request.user_id,
            scenario_id=request.scenario_id,
            db=db
        )
        
        # Schedule cleanup task as an independent asyncio task 
        # (BackgroundTasks blocks server shutdown for the duration of the sleep)
        asyncio.create_task(
            schedule_cleanup(
                sandbox_manager,
                sandbox_info["container_name"],
                sandbox_info["expires_at"],
                db
            )
        )
        
        logger.info(f"Launched sandbox {sandbox_info['container_name']} for user {request.user_id}")
        
        return sandbox_info
        
    except ValueError as e:
        # Scenario not found or validation error
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to launch sandbox: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to launch sandbox: {str(e)}")


@router.post("/stop/{container_name}")
async def stop_sandbox(container_name: str):
    """
    Stop a running sandbox container.
    """
    try:
        db = get_firestore_client()
        result = await sandbox_manager.stop_sandbox(container_name, db)
        
        logger.info(f"Stopped sandbox {container_name}")
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to stop sandbox {container_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to stop sandbox: {str(e)}")


@router.get("/status/{container_name}")
async def get_sandbox_status(container_name: str):
    """
    Get current status of a sandbox container.
    """
    try:
        status = await sandbox_manager.get_sandbox_status(container_name)
        return status
    except Exception as e:
        logger.error(f"Failed to get status for {container_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}")
async def get_user_sandboxes(user_id: str):
    """
    Get all active sandboxes for a specific user.
    """
    try:
        sandboxes = await sandbox_manager.list_user_sandboxes(user_id)
        return {"sandboxes": sandboxes}
    except Exception as e:
        logger.error(f"Failed to get sandboxes for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extend/{container_name}")
async def extend_sandbox_time(
    container_name: str,
    request: ExtendTimeRequest
):
    """
    Extend the expiry time of a running sandbox.
    """
    try:
        db = get_firestore_client()
        result = await sandbox_manager.extend_sandbox_time(
            container_name, 
            request.hours, 
            db
        )
        
        logger.info(f"Extended sandbox {container_name} by {request.hours} hours")
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to extend time for {container_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Health check endpoint to verify Docker service availability.
    """
    docker_available = sandbox_manager.is_docker_available()
    
    if not docker_available:
        return {
            "status": "unhealthy",
            "docker": "unavailable",
            "message": "Docker service is not accessible"
        }
    
    return {
        "status": "healthy",
        "docker": "available",
        "message": "Sandbox service is operational"
    }


async def schedule_cleanup(
    manager: SandboxManager, 
    container_name: str, 
    expires_at: datetime,
    db
):
    """
    Background task to cleanup expired sandbox.
    This runs after the expiry time and removes the container.
    Catches CancelledError to allow clean uvicorn shutdown.
    Re-checks database to handle time extensions.
    """
    import asyncio
    from datetime import datetime
    
    current_expiry = expires_at
    
    while True:
        # Calculate wait time
        now = datetime.utcnow()
        if isinstance(current_expiry, str):
            current_expiry = datetime.fromisoformat(current_expiry)
        
        wait_seconds = (current_expiry - now).total_seconds()
        
        if wait_seconds > 0:
            logger.info(f"Scheduled cleanup for {container_name} in {wait_seconds} seconds")
            try:
                await asyncio.sleep(wait_seconds)
            except asyncio.CancelledError:
                logger.info(f"Cleanup task for {container_name} cancelled (server shutting down)")
                return
                
        # After waking up, verify in the database if the expiry was extended
        try:
            doc_ref = db.collection("sandbox_sessions").document(container_name)
            doc = doc_ref.get()
            
            if not doc.exists:
                return # Already deleted or stopped manually
                
            data = doc.to_dict()
            if data.get("status") != "running":
                return # Already stopped
                
            db_expiry = data.get("expires_at")
            if hasattr(db_expiry, "timestamp"): # Handle Firestore DatetimeWithNanoseconds
                from datetime import timezone
                db_expiry = datetime.fromtimestamp(db_expiry.timestamp())
            elif isinstance(db_expiry, str):
                db_expiry = datetime.fromisoformat(db_expiry)
                
            if db_expiry and db_expiry > datetime.utcnow():
                logger.info(f"Sandbox {container_name} expiry was extended. Rescheduling.")
                current_expiry = db_expiry
                continue # Loop again and sleep for the new duration
                
        except Exception as e:
            logger.error(f"Error checking sandbox {container_name} expiry status: {str(e)}")
            
        # If we reach here, it's truly expired (or errored out checking), break and clean up
        break
    
    # Perform cleanup
    try:
        await manager.stop_sandbox(container_name, db)
        logger.info(f"Auto-cleaned up expired sandbox {container_name}")
    except Exception as e:
        logger.error(f"Failed to auto-cleanup {container_name}: {str(e)}")


# Startup event to clean up any orphaned containers
@router.on_event("startup")
async def startup_cleanup():
    """
    Clean up any expired sandboxes on server startup.
    """
    try:
        db = get_firestore_client()
        await sandbox_manager.cleanup_expired_sandboxes(db)
        logger.info("Completed startup cleanup of expired sandboxes")
    except Exception as e:
        logger.error(f"Startup cleanup failed: {str(e)}")

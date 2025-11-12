from fastapi import APIRouter, Depends
from app.auth import verify_firebase_token

router = APIRouter()

@router.get("/profile")
async def get_profile(user=Depends(verify_firebase_token)):
    return {"uid": user["uid"], "email": user.get("email")}

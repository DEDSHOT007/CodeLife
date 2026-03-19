from fastapi import APIRouter, Depends, HTTPException
from app.auth import verify_firebase_token
from app.firestore_db import UserProgressService

# Ensure Firebase Admin SDK is initialized (loads service account JSON in backend/app)
import app.firebase_admin  # initializes firebase_admin with credentials.Certificate(...)

# Use the Firestore client exposed by firebase_admin so it uses the Admin SDK credentials
from firebase_admin import firestore as admin_firestore

router = APIRouter(prefix="/user")
# firebase_admin.firestore.client() returns a client bound to the initialized credentials
db = admin_firestore.client()

@router.get("/profile")
async def get_profile(user=Depends(verify_firebase_token)):
    uid = user["uid"]
    # Get user document from Firestore
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found")

    user_data = user_doc.to_dict() or {}

    return {
        "uid": uid,
        "email": user.get("email"),
        "name": user_data.get("name", ""),
        "dob": user_data.get("dob", ""),
        "gender": user_data.get("gender", ""),
        "country": user_data.get("country", ""),
        "state": user_data.get("state", ""),
        "institution": user_data.get("institution", ""),
        "email_verified": user_data.get("email_verified", False),
    }

@router.get("/progress")
async def get_progress(user=Depends(verify_firebase_token)):
    user_id = user["uid"]
    summary = UserProgressService.get_user_progress_summary(user_id)
    return summary


@router.get("/courses")
async def get_enrolled_courses(user=Depends(verify_firebase_token)):
    uid = user["uid"]
    try:
        enrolled_courses = UserProgressService.get_enrolled_courses(uid)
        return {"enrolled_courses": enrolled_courses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
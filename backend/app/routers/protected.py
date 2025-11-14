from fastapi import APIRouter, Depends, HTTPException
from app.auth import verify_firebase_token
from app.firestore_db import UserProgressService

# Import Firestore client (make sure google-cloud-firestore is installed and set up)
from google.cloud import firestore

router = APIRouter(prefix="/user")
db = firestore.Client()

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
    # Fetch user's enrolled courses from Firestore 'user_enrollments' collection or suitable path
    # Example assumed path: user_enrollments/{uid} where courses is a list field

    user_enroll_doc = db.collection("user_enrollments").document(uid).get()
    
    if not user_enroll_doc.exists:
        return {"enrolled_courses": []}  # no enrollments yet
    
    data = user_enroll_doc.to_dict()
    enrolled_courses = data.get("courses", [])

    # Optionally fetch course details from 'courses' collection if you want full info

    return {"enrolled_courses": enrolled_courses}
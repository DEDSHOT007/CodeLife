from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.firestore_db import CourseService, LessonService, UserProgressService
from app.auth import verify_firebase_token
from pydantic import BaseModel

router = APIRouter(prefix="/courses", tags=["courses"])


# Pydantic Schemas
class LessonSchema(BaseModel):
    id: str
    title: str
    content: str
    order: int
    duration_minutes: int | None = None
    video_url: str | None = None
    completed: bool = False


class CourseSchema(BaseModel):
    id: str
    title: str
    description: str | None = None
    difficulty: str
    duration_hours: int | None = None
    thumbnail_url: str | None = None
    lesson_count: int


class CourseDetailSchema(BaseModel):
    id: str
    title: str
    description: str | None = None
    difficulty: str
    duration_hours: int | None = None
    thumbnail_url: str | None = None
    lessons: List[LessonSchema]


# Endpoints

@router.get("/", response_model=List[CourseSchema])
async def get_all_courses(user=Depends(verify_firebase_token)):
    """Get all available courses"""
    try:
        courses = CourseService.get_all_courses()
        return courses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}", response_model=CourseDetailSchema)
async def get_course_detail(
    course_id: str,
    user=Depends(verify_firebase_token)
):
    """Get course details with lessons"""
    try:
        course = CourseService.get_course_by_id(course_id)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        user_id = user["uid"]
        
        # Get user's completed lessons
        completed_lessons = UserProgressService.get_user_completed_lessons(user_id)
        
        # Add completion status to each lesson
        for lesson in course.get("lessons", []):
            lesson["completed"] = lesson["id"] in completed_lessons
        
        return course
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{course_id}/lessons/{lesson_id}/complete")
async def mark_lesson_complete(
    course_id: str,
    lesson_id: str,
    user=Depends(verify_firebase_token)
):
    """Mark a lesson as completed"""
    try:
        user_id = user["uid"]
        
        # Verify lesson exists
        lesson = LessonService.get_lesson(course_id, lesson_id)
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        # Mark as complete
        UserProgressService.mark_lesson_complete(user_id, course_id, lesson_id)
        
        return {
            "message": "Lesson marked as complete",
            "lesson_id": lesson_id,
            "course_id": course_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/progress/summary")
async def get_user_progress_summary(
    user=Depends(verify_firebase_token)
):
    """Get user's overall progress summary"""
    try:
        user_id = user["uid"]
        summary = UserProgressService.get_user_progress_summary(user_id)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

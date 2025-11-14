# import firebase_admin
# from firebase_admin import firestore, credentials
# from typing import List, Dict, Optional
# from datetime import datetime

# # Initialize Firebase if not already initialized
# if not firebase_admin.get_app():
#     cred_path = os.path.join(os.path.dirname(__file__), '..', 'codelife-9e846-firebase-adminsdk-fbsvc-53ac4d61e7.json')
#     cred = credentials.Certificate(cred_path)
#     firebase_admin.initialize_app(cred)

# # Initialize Firestore
# db = firestore.client()

# # Collection names
# COURSES_COLLECTION = "courses"
# LESSONS_COLLECTION = "lessons"
# USER_PROGRESS_COLLECTION = "user_progress"


# class CourseService:
#     """Service for managing courses in Firestore"""

#     @staticmethod
#     def create_course(course_data: Dict) -> str:
#         """Create a new course and return its ID"""
#         course_data["created_at"] = datetime.now()
#         doc_ref = db.collection(COURSES_COLLECTION).add(course_data)
#         return doc_ref.id

#     @staticmethod
#     def get_all_courses() -> List[Dict]:
#         """Get all courses"""
#         courses = []
#         docs = db.collection(COURSES_COLLECTION).stream()
        
#         for doc in docs:
#             course = doc.to_dict()
#             course["id"] = doc.id
#             # Count lessons in this course
#             lessons_count = db.collection(COURSES_COLLECTION).document(doc.id).collection(LESSONS_COLLECTION).count().get().value
#             course["lesson_count"] = lessons_count
#             courses.append(course)
        
#         return courses

#     @staticmethod
#     def get_course_by_id(course_id: str) -> Optional[Dict]:
#         """Get a specific course by ID"""
#         doc = db.collection(COURSES_COLLECTION).document(course_id).get()
        
#         if not doc.exists:
#             return None
        
#         course = doc.to_dict()
#         course["id"] = doc.id
        
#         # Get all lessons for this course
#         lessons = []
#         lesson_docs = db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).order_by("order").stream()
        
#         for lesson_doc in lesson_docs:
#             lesson = lesson_doc.to_dict()
#             lesson["id"] = lesson_doc.id
#             lessons.append(lesson)
        
#         course["lessons"] = lessons
#         return course

#     @staticmethod
#     def update_course(course_id: str, course_data: Dict) -> bool:
#         """Update a course"""
#         course_data["updated_at"] = datetime.now()
#         db.collection(COURSES_COLLECTION).document(course_id).update(course_data)
#         return True

#     @staticmethod
#     def delete_course(course_id: str) -> bool:
#         """Delete a course and all its lessons"""
#         # Delete all lessons in this course
#         lessons = db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).stream()
#         for lesson in lessons:
#             lesson.reference.delete()
        
#         # Delete course
#         db.collection(COURSES_COLLECTION).document(course_id).delete()
#         return True


# class LessonService:
#     """Service for managing lessons in Firestore"""

#     @staticmethod
#     def create_lesson(course_id: str, lesson_data: Dict) -> str:
#         """Create a new lesson for a course"""
#         lesson_data["created_at"] = datetime.now()
#         doc_ref = db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).add(lesson_data)
#         return doc_ref.id

#     @staticmethod
#     def get_lesson(course_id: str, lesson_id: str) -> Optional[Dict]:
#         """Get a specific lesson"""
#         doc = db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).document(lesson_id).get()
        
#         if not doc.exists:
#             return None
        
#         lesson = doc.to_dict()
#         lesson["id"] = doc.id
#         return lesson

#     @staticmethod
#     def update_lesson(course_id: str, lesson_id: str, lesson_data: Dict) -> bool:
#         """Update a lesson"""
#         lesson_data["updated_at"] = datetime.now()
#         db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).document(lesson_id).update(lesson_data)
#         return True

#     @staticmethod
#     def delete_lesson(course_id: str, lesson_id: str) -> bool:
#         """Delete a lesson"""
#         db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).document(lesson_id).delete()
#         return True


# class UserProgressService:
#     """Service for managing user progress in Firestore"""

#     @staticmethod
#     def mark_lesson_complete(user_id: str, course_id: str, lesson_id: str) -> bool:
#         """Mark a lesson as completed for a user"""
#         progress_data = {
#             "user_id": user_id,
#             "course_id": course_id,
#             "lesson_id": lesson_id,
#             "completed": True,
#             "completed_at": datetime.now(),
#             "created_at": datetime.now()
#         }
        
#         # Use a unique document ID combining user, course, and lesson
#         doc_id = f"{user_id}_{course_id}_{lesson_id}"
#         db.collection(USER_PROGRESS_COLLECTION).document(doc_id).set(progress_data, merge=True)
#         return True

#     @staticmethod
#     def get_user_completed_lessons(user_id: str) -> List[str]:
#         """Get all lessons completed by a user"""
#         docs = db.collection(USER_PROGRESS_COLLECTION).where("user_id", "==", user_id).where("completed", "==", True).stream()
        
#         completed_lessons = []
#         for doc in docs:
#             data = doc.to_dict()
#             completed_lessons.append(data.get("lesson_id"))
        
#         return completed_lessons

#     @staticmethod
#     def get_user_progress_summary(user_id: str) -> Dict:
#         """Get user's overall progress summary"""
#         # Get all completed lessons for user
#         completed_docs = db.collection(USER_PROGRESS_COLLECTION).where("user_id", "==", user_id).where("completed", "==", True).stream()
        
#         completed_lessons = []
#         completed_courses = set()
        
#         for doc in completed_docs:
#             data = doc.to_dict()
#             completed_lessons.append(data.get("lesson_id"))
#             completed_courses.add(data.get("course_id"))
        
#         # Count total lessons and courses
#         total_courses = len(db.collection(COURSES_COLLECTION).stream())
        
#         total_lessons = 0
#         for course_doc in db.collection(COURSES_COLLECTION).stream():
#             course_lessons = db.collection(COURSES_COLLECTION).document(course_doc.id).collection(LESSONS_COLLECTION).stream()
#             for _ in course_lessons:
#                 total_lessons += 1
        
#         return {
#             "courses_completed": len(completed_courses),
#             "total_courses": total_courses,
#             "lessons_completed": len(completed_lessons),
#             "total_lessons": total_lessons,
#             "progress_percentage": round((len(completed_lessons) / total_lessons * 100), 2) if total_lessons > 0 else 0
#         }

#     @staticmethod
#     def is_lesson_completed(user_id: str, course_id: str, lesson_id: str) -> bool:
#         """Check if a user has completed a specific lesson"""
#         doc_id = f"{user_id}_{course_id}_{lesson_id}"
#         doc = db.collection(USER_PROGRESS_COLLECTION).document(doc_id).get()
        
#         if doc.exists:
#             return doc.to_dict().get("completed", False)
#         return False
import os
import firebase_admin
from firebase_admin import firestore, credentials
from typing import List, Dict, Optional
from datetime import datetime

def init_firebase():
    try:
        return firebase_admin.get_app()
    except ValueError:
        cred_path = os.path.join(os.path.dirname(__file__), '..', 'codelife-9e846-firebase-adminsdk-fbsvc-53ac4d61e7.json')
        cred = credentials.Certificate(cred_path)
        return firebase_admin.initialize_app(cred)

def get_firestore_client():
    app = init_firebase()
    return firestore.client(app)

COURSES_COLLECTION = "courses"
LESSONS_COLLECTION = "lessons"
USER_PROGRESS_COLLECTION = "user_progress"

class CourseService:

    @staticmethod
    def create_course(course_data: Dict) -> str:
        db = get_firestore_client()
        course_data["created_at"] = datetime.now()
        doc_ref = db.collection(COURSES_COLLECTION).add(course_data)
        return doc_ref[1].id

    @staticmethod
    def get_all_courses() -> List[Dict]:
        db = get_firestore_client()
        courses = []
        docs = db.collection(COURSES_COLLECTION).stream()

        for doc in docs:
            course = doc.to_dict()
            course["id"] = doc.id
            lessons_count = db.collection(COURSES_COLLECTION).document(doc.id).collection(LESSONS_COLLECTION).count().get()[0][0].value
            course["lesson_count"] = lessons_count
            courses.append(course)

        return courses

    @staticmethod
    def get_course_by_id(course_id: str) -> Optional[Dict]:
        db = get_firestore_client()
        doc = db.collection(COURSES_COLLECTION).document(course_id).get()

        if not doc.exists:
            return None
        
        course = doc.to_dict()
        course["id"] = doc.id

        lessons = []
        lesson_docs = db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).order_by("order").stream()
        
        for lesson_doc in lesson_docs:
            lesson = lesson_doc.to_dict()
            lesson["id"] = lesson_doc.id
            lessons.append(lesson)
        
        course["lessons"] = lessons
        return course

    @staticmethod
    def update_course(course_id: str, course_data: Dict) -> bool:
        db = get_firestore_client()
        course_data["updated_at"] = datetime.now()
        db.collection(COURSES_COLLECTION).document(course_id).update(course_data)
        return True

    @staticmethod
    def delete_course(course_id: str) -> bool:
        db = get_firestore_client()
        lessons = db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).stream()
        for lesson in lessons:
            lesson.reference.delete()
        db.collection(COURSES_COLLECTION).document(course_id).delete()
        return True

class LessonService:

    @staticmethod
    def create_lesson(course_id: str, lesson_data: Dict) -> str:
        db = get_firestore_client()
        lesson_data["created_at"] = datetime.now()
        doc_ref = db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).add(lesson_data)
        return doc_ref[1].id

    @staticmethod
    def get_lesson(course_id: str, lesson_id: str) -> Optional[Dict]:
        db = get_firestore_client()
        doc = db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).document(lesson_id).get()

        if not doc.exists:
            return None
        
        lesson = doc.to_dict()
        lesson["id"] = doc.id
        return lesson

    @staticmethod
    def update_lesson(course_id: str, lesson_id: str, lesson_data: Dict) -> bool:
        db = get_firestore_client()
        lesson_data["updated_at"] = datetime.now()
        db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).document(lesson_id).update(lesson_data)
        return True

    @staticmethod
    def delete_lesson(course_id: str, lesson_id: str) -> bool:
        db = get_firestore_client()
        db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).document(lesson_id).delete()
        return True

class UserProgressService:

    @staticmethod
    def mark_lesson_complete(user_id: str, course_id: str, lesson_id: str) -> bool:
        db = get_firestore_client()
        progress_data = {
            "user_id": user_id,
            "course_id": course_id,
            "lesson_id": lesson_id,
            "completed": True,
            "completed_at": datetime.now(),
            "created_at": datetime.now()
        }
        
        doc_id = f"{user_id}_{course_id}_{lesson_id}"
        db.collection(USER_PROGRESS_COLLECTION).document(doc_id).set(progress_data, merge=True)
        return True

    @staticmethod
    def get_user_completed_lessons(user_id: str) -> List[str]:
        db = get_firestore_client()
        docs = db.collection(USER_PROGRESS_COLLECTION).where("user_id", "==", user_id).where("completed", "==", True).stream()

        completed_lessons = []
        for doc in docs:
            data = doc.to_dict()
            completed_lessons.append(data.get("lesson_id"))
        
        return completed_lessons

    @staticmethod
    def get_user_progress_summary(user_id: str) -> Dict:
        db = get_firestore_client()
        completed_docs = db.collection(USER_PROGRESS_COLLECTION).where("user_id", "==", user_id).where("completed", "==", True).stream()

        completed_lessons = []
        completed_courses = set()

        for doc in completed_docs:
            data = doc.to_dict()
            completed_lessons.append(data.get("lesson_id"))
            completed_courses.add(data.get("course_id"))

        total_courses = len(list(db.collection(COURSES_COLLECTION).stream()))

        total_lessons = 0
        for course_doc in db.collection(COURSES_COLLECTION).stream():
            course_lessons = db.collection(COURSES_COLLECTION).document(course_doc.id).collection(LESSONS_COLLECTION).stream()
            for _ in course_lessons:
                total_lessons += 1

        return {
            "courses_completed": len(completed_courses),
            "total_courses": total_courses,
            "lessons_completed": len(completed_lessons),
            "total_lessons": total_lessons,
            "progress_percentage": round((len(completed_lessons) / total_lessons * 100), 2) if total_lessons > 0 else 0
        }

    @staticmethod
    def is_lesson_completed(user_id: str, course_id: str, lesson_id: str) -> bool:
        db = get_firestore_client()
        doc_id = f"{user_id}_{course_id}_{lesson_id}"
        doc = db.collection(USER_PROGRESS_COLLECTION).document(doc_id).get()

        if doc.exists:
            return doc.to_dict().get("completed", False)
        return False

class QuizService:
    """Service for managing quizzes"""

    @staticmethod
    def get_lesson_quizzes(course_id: str, lesson_id: str) -> List[Dict]:
        db = get_firestore_client()
        doc = db.collection(COURSES_COLLECTION).document(course_id).collection(LESSONS_COLLECTION).document(lesson_id).get()
        
        if not doc.exists:
            return []
        
        lesson = doc.to_dict()
        return lesson.get("quizzes", [])

    @staticmethod
    def submit_quiz(user_id: str, course_id: str, lesson_id: str, score: int) -> bool:
        db = get_firestore_client()
        doc_id = f"{user_id}_{course_id}_{lesson_id}"
        progress_data = {
            "quiz_score": score,
            "quiz_completed": True,
            "updated_at": datetime.now()
        }
        db.collection(USER_PROGRESS_COLLECTION).document(doc_id).update(progress_data)
        return True

    @staticmethod
    def get_quiz_score(user_id: str, course_id: str, lesson_id: str) -> Optional[int]:
        db = get_firestore_client()
        doc_id = f"{user_id}_{course_id}_{lesson_id}"
        doc = db.collection(USER_PROGRESS_COLLECTION).document(doc_id).get()
        
        if doc.exists:
            return doc.to_dict().get("quiz_score")
        return None


class AchievementService:
    """Service for managing achievements"""

    @staticmethod
    def get_user_achievements(user_id: str) -> List[Dict]:
        db = get_firestore_client()
        docs = db.collection(USER_PROGRESS_COLLECTION).where("user_id", "==", user_id).stream()
        
        achievements = []
        for doc in docs:
            data = doc.to_dict()
            if "achievements" in data:
                achievements.extend(data["achievements"])
        
        return list(set(achievements))

    @staticmethod
    def unlock_achievement(user_id: str, achievement_id: str) -> bool:
        db = get_firestore_client()
        # Find first progress document for this user to attach achievement
        docs = db.collection(USER_PROGRESS_COLLECTION).where("user_id", "==", user_id).limit(1).stream()
        
        for doc in docs:
            current_achievements = doc.to_dict().get("achievements", [])
            if achievement_id not in current_achievements:
                current_achievements.append(achievement_id)
                db.collection(USER_PROGRESS_COLLECTION).document(doc.id).update({
                    "achievements": current_achievements,
                    "updated_at": datetime.now()
                })
            break
        
        return True

    @staticmethod
    def check_and_unlock_achievements(user_id: str) -> List[str]:
        """Check if user qualifies for any new achievements"""
        db = get_firestore_client()
        
        # Example: Unlock achievement after completing 5 lessons
        completed_count = db.collection(USER_PROGRESS_COLLECTION).where(
            "user_id", "==", user_id
        ).where("completed", "==", True).count().get().value
        
        unlocked = []
        if completed_count >= 5:
            AchievementService.unlock_achievement(user_id, "achievement_5_lessons")
            unlocked.append("achievement_5_lessons")
        
        return unlocked

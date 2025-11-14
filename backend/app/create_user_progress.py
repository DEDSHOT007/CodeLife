import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta

# Initialize Firebase Admin SDK
cred = credentials.Certificate('codelife-9e846-firebase-adminsdk-fbsvc-53ac4d61e7.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

def create_user_progress():
    users = ['user1', 'user2', 'user3']
    courses = ['GJ2kbTNr1f5ulDipBxaj', '2WZPwl4qiaODuruHXEUk', '2GufzbiatM3Oq15JFL4u']  # Example course IDs from seeding
    lessons = {
        'GJ2kbTNr1f5ulDipBxaj': ['lesson1', 'lesson2', 'lesson3'],  # Lessons IDs to be updated with actual IDs
        '2WZPwl4qiaODuruHXEUk': ['lesson1', 'lesson2', 'lesson3'],
        '2GufzbiatM3Oq15JFL4u': ['lesson1', 'lesson2', 'lesson3']
    }

    for user in users:
        for course_id in courses:
            for lesson_id in lessons[course_id]:
                doc_id = f"{user}_{course_id}_{lesson_id}"
                doc_ref = db.collection('user_progress').document(doc_id)

                # Example: Mark first lesson completed for user1
                completed = False
                quiz_completed = False
                quiz_score = None
                completed_at = None
                achievements = []

                if user == 'user1' and lesson_id == 'lesson1':
                    completed = True
                    quiz_completed = True
                    quiz_score = 90
                    completed_at = datetime.utcnow() - timedelta(days=1)
                    achievements = ['achievement_1']

                progress_data = {
                    'user_id': user,
                    'course_id': course_id,
                    'lesson_id': lesson_id,
                    'completed': completed,
                    'quiz_completed': quiz_completed,
                    'quiz_score': quiz_score,
                    'completed_at': completed_at,
                    'achievements': achievements
                }

                doc_ref.set(progress_data)
                print(f"Created progress for {doc_id}")

if __name__ == "__main__":
    create_user_progress()

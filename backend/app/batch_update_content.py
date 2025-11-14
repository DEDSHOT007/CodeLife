import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Initialize Firebase Admin SDK (adjust path!)
cred = credentials.Certificate('codelife-9e846-firebase-adminsdk-fbsvc-53ac4d61e7.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

def batch_update_lessons():
    courses_ref = db.collection('courses')
    courses = courses_ref.stream()

    for course in courses:
        course_id = course.id
        print(f'Updating lessons in course: {course_id}')
        lessons_ref = courses_ref.document(course_id).collection('lessons')
        lessons = lessons_ref.stream()

        for lesson in lessons:
            lesson_id = lesson.id
            lesson_doc_ref = lessons_ref.document(lesson_id)

            # Richer sample quizzes
            quizzes = [
                {
                    'question': 'What is Cybersecurity?',
                    'options': ['Protection of computers', 'Cooking', 'Gardening', 'Sports'],
                    'correct_answer': 0,
                    'explanation': 'Cybersecurity is the protection of computer systems.'
                },
                {
                    'question': 'Which is a common cyber threat?',
                    'options': ['Phishing', 'Fishing', 'Shopping', 'Singing'],
                    'correct_answer': 0,
                    'explanation': 'Phishing is a social engineering cyber attack.'
                },
                {
                    'question': 'What does SSL stand for?',
                    'options': ['Secure Socket Layer', 'Simple Service List', 'Secure System Login', 'Server Side Lock'],
                    'correct_answer': 0,
                    'explanation': 'SSL stands for Secure Socket Layer, a protocol for encrypting internet connections.'
                }
            ]

            # More comprehensive articles array
            articles = [
                {
                    'title': 'Understanding Cybersecurity Basics',
                    'content': 'Cybersecurity involves protecting systems, networks, and programs from digital attacks. It is crucial in protecting personal data and organizational assets.'
                },
                {
                    'title': 'Overview of Social Engineering',
                    'content': 'Social engineering attacks exploit human psychology to trick individuals into divulging confidential information.'
                }
            ]

            lesson_doc_ref.update({
                'quizzes': quizzes,
                'articles': articles,
                'updated_at': datetime.utcnow()
            })
            print(f'Updated lesson {lesson_id} with quizzes and articles.')

def batch_add_achievements():
    achievements_data = [
        {
            'title': 'First Steps',
            'description': 'Complete your first lesson',
            'icon': '🎯',
            'criteria': {'lessons_completed': 1},
            'created_at': datetime.utcnow()
        },
        {
            'title': 'Learning Enthusiast',
            'description': 'Complete 5 lessons',
            'icon': '⭐',
            'criteria': {'lessons_completed': 5},
            'created_at': datetime.utcnow()
        },
        {
            'title': 'Course Master',
            'description': 'Complete an entire course',
            'icon': '🏆',
            'criteria': {'courses_completed': 1},
            'created_at': datetime.utcnow()
        },
        {
            'title': 'Quiz Whiz',
            'description': 'Score 100% on a quiz',
            'icon': '🧠',
            'criteria': {'quiz_perfect_score': True},
            'created_at': datetime.utcnow()
        },
        {
            'title': 'Cybersecurity Pro',
            'description': 'Complete 10 lessons',
            'icon': '🛡️',
            'criteria': {'lessons_completed': 10},
            'created_at': datetime.utcnow()
        },
        {
            'title': 'Achievement Collector',
            'description': 'Unlock 5 achievements',
            'icon': '🏅',
            'criteria': {'achievements_unlocked': 5},
            'created_at': datetime.utcnow()
        }
    ]

    achievements_ref = db.collection('achievements')
    for ach in achievements_data:
        doc_ref = achievements_ref.document()
        doc_ref.set(ach)
        print(f'Added achievement: {ach["title"]}')


if __name__ == "__main__":
    print("Starting batch update...")
    batch_update_lessons()
    batch_add_achievements()
    print("Batch update completed.")

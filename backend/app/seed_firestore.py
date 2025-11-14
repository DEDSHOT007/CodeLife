from app.firestore_db import CourseService, LessonService

def seed_firestore():
    """Seed Firestore with sample courses and lessons"""
    
    print("Seeding Firestore with sample data...")
    
    # Course 1: Introduction to Cybersecurity
    course1_data = {
        "title": "Introduction to Cybersecurity",
        "description": "Learn the fundamentals of cybersecurity, including threats, vulnerabilities, and basic defense mechanisms.",
        "difficulty": "Beginner",
        "duration_hours": 8,
        "thumbnail_url": "https://via.placeholder.com/300x200?text=Intro+to+Cyber"
    }
    course1_id = CourseService.create_course(course1_data)
    print(f"Created Course 1: {course1_id}")
    
    lessons1 = [
        {
            "title": "What is Cybersecurity?",
            "content": "An overview of cybersecurity concepts, importance, and career paths.",
            "order": 1,
            "duration_minutes": 30
        },
        {
            "title": "Common Cyber Threats",
            "content": "Understanding malware, phishing, ransomware, and social engineering attacks.",
            "order": 2,
            "duration_minutes": 45
        },
        {
            "title": "Basic Defense Strategies",
            "content": "Learn about firewalls, antivirus software, and security best practices.",
            "order": 3,
            "duration_minutes": 40
        }
    ]
    
    for lesson in lessons1:
        LessonService.create_lesson(course1_id, lesson)
    print(f"Created {len(lessons1)} lessons for Course 1")
    
    # Course 2: Network Security Essentials
    course2_data = {
        "title": "Network Security Essentials",
        "description": "Deep dive into network protocols, encryption, and securing network infrastructure.",
        "difficulty": "Intermediate",
        "duration_hours": 12,
        "thumbnail_url": "https://via.placeholder.com/300x200?text=Network+Security"
    }
    course2_id = CourseService.create_course(course2_data)
    print(f"Created Course 2: {course2_id}")
    
    lessons2 = [
        {
            "title": "Network Protocols and Security",
            "content": "Understanding TCP/IP, DNS, HTTP/HTTPS and their security implications.",
            "order": 1,
            "duration_minutes": 50
        },
        {
            "title": "Encryption and Cryptography",
            "content": "Learn symmetric and asymmetric encryption, hashing, and digital signatures.",
            "order": 2,
            "duration_minutes": 60
        },
        {
            "title": "Firewalls and IDS/IPS",
            "content": "Configuring firewalls and intrusion detection/prevention systems.",
            "order": 3,
            "duration_minutes": 55
        }
    ]
    
    for lesson in lessons2:
        LessonService.create_lesson(course2_id, lesson)
    print(f"Created {len(lessons2)} lessons for Course 2")
    
    # Course 3: Web Application Security
    course3_data = {
        "title": "Web Application Security",
        "description": "Learn to identify and prevent common web vulnerabilities like SQL injection, XSS, and CSRF.",
        "difficulty": "Advanced",
        "duration_hours": 15,
        "thumbnail_url": "https://via.placeholder.com/300x200?text=Web+App+Security"
    }
    course3_id = CourseService.create_course(course3_data)
    print(f"Created Course 3: {course3_id}")
    
    lessons3 = [
        {
            "title": "OWASP Top 10 Overview",
            "content": "Introduction to the OWASP Top 10 web application security risks.",
            "order": 1,
            "duration_minutes": 45
        },
        {
            "title": "SQL Injection Attacks",
            "content": "Understanding and preventing SQL injection vulnerabilities.",
            "order": 2,
            "duration_minutes": 60
        },
        {
            "title": "Cross-Site Scripting (XSS)",
            "content": "Learn about XSS attacks and how to protect against them.",
            "order": 3,
            "duration_minutes": 50
        }
    ]
    
    for lesson in lessons3:
        LessonService.create_lesson(course3_id, lesson)
    print(f"Created {len(lessons3)} lessons for Course 3")
    
    print("\n✅ Firestore seeding completed successfully!")
    print(f"Total courses created: 3")
    print(f"Total lessons created: {len(lessons1) + len(lessons2) + len(lessons3)}")


if __name__ == "__main__":
    seed_firestore()

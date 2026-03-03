import sys
import os
import json

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.code_analysis_service import code_analysis_service

def test_analysis():
    print("--- Testing Code Analysis Service ---")
    
    # Sample vulnerable code (SQL Injection + Hardcoded Password)
    vulnerable_code = """
import sqlite3

def get_user(username):
    # Vulnerability: SQL Injection
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    
    # Vulnerability: Hardcoded password
    password = "secret_password_123"
    
    conn = sqlite3.connect("db.sqlite")
    cursor = conn.cursor()
    cursor.execute(query)
    return cursor.fetchall()
    """
    
    print("Analyzing vulnerable Python code...")
    result = code_analysis_service.analyze_code(vulnerable_code, "python")
    
    print(f"Score: {result['score']}")
    print(f"Vulnerabilities found: {len(result['vulnerabilities'])}")
    
    for v in result['vulnerabilities']:
        print(f"- [{v['severity']}] Line {v['line']}: {v['message']}")
        
    if len(result['vulnerabilities']) > 0:
        print("\nSUCCESS: Vulnerabilities detected.")
    else:
        print("\nFAILURE: No vulnerabilities found (Check if bandit is installed).")

if __name__ == "__main__":
    test_analysis()

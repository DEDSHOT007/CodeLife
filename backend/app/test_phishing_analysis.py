import sys
import os
import json

# Add the backend directory to sys.path to allow imports from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app.services.phishing_service import phishing_service
    
    print("--- End-to-End Phishing Analysis Test ---")
    
    test_phishing = "URGENT: Your account has been suspended! Click here to verify your identity immediately: http://192.168.1.10/verify-login"
    test_legit = "Hi Team, the meeting has been rescheduled to tomorrow at 10 AM. See you there!"
    
    print("\n[TEST 1] Phishing Sample")
    res1 = phishing_service.analyze_email(test_phishing)
    print(json.dumps(res1, indent=2))
    
    print("\n[TEST 2] Legitimate Sample")
    res2 = phishing_service.analyze_email(test_legit)
    print(json.dumps(res2, indent=2))
    
    print("\nAnalysis Status:", res1["explanations"]["model_status"])
        
except Exception as e:
    import traceback
    print(f"Error during analysis test: {str(e)}")
    print(traceback.format_exc())
LineContent:     print(traceback.format_exc())

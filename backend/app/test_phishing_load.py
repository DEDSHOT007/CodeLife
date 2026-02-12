import sys
import os

# Add the backend directory to sys.path to allow imports from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app.services.phishing_service import phishing_service
    
    print("--- Phishing Service Health Check ---")
    print(f"Placeholder Mode: {phishing_service.placeholder_mode}")
    print(f"Vectorizer Loaded: {phishing_service.vectorizer is not None}")
    print(f"LogReg Loaded: {phishing_service.logreg is not None}")
    print(f"SVM Loaded: {phishing_service.svm is not None}")
    print(f"DistilBERT Loaded: {phishing_service.bert_model is not None}")
    
    if phishing_service.vectorizer and phishing_service.logreg and phishing_service.svm:
        print("\nSUCCESS: Classic ML models loaded correctly.")
    else:
        print("\nFAILURE: One or more classic ML models failed to load.")
        
except Exception as e:
    print(f"Error during health check: {str(e)}")

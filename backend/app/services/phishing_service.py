import os
import pickle
import logging
import re
from typing import Dict, List, Any, Optional
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PhishingService:
    _instance = None
    
    # Paths to model assets
    MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    TFIDF_PATH = os.path.join(MODEL_DIR, "tfidf_20k.pkl")
    LOGREG_PATH = os.path.join(MODEL_DIR, "logreg_20k.pkl")
    SVM_PATH = os.path.join(MODEL_DIR, "svm_20k.pkl")
    DISTILBERT_DIR = os.path.join(MODEL_DIR, "distilbert-phishing")
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PhishingService, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return
            
        self.placeholder_mode = False
        self.classic_ready = False
        self.bert_ready = False
        
        self.vectorizer = None
        self.logreg = None
        self.svm = None
        self.tokenizer = None
        self.bert_model = None
        
        # Load models lazily or set placeholder mode
        self._load_models()
        self.initialized = True

    def _load_models(self):
        try:
            # Check for classic ML models
            if os.path.exists(self.TFIDF_PATH) and os.path.exists(self.LOGREG_PATH) and os.path.exists(self.SVM_PATH):
                with open(self.TFIDF_PATH, 'rb') as f:
                    self.vectorizer = pickle.load(f)
                with open(self.LOGREG_PATH, 'rb') as f:
                    self.logreg = pickle.load(f)
                with open(self.SVM_PATH, 'rb') as f:
                    self.svm = pickle.load(f)
                self.classic_ready = True
                logger.info("Classic ML models loaded successfully.")
            else:
                logger.warning(f"Classic ML models not found at {self.MODEL_DIR}.")

            # Check for DistilBERT
            if os.path.exists(self.DISTILBERT_DIR):
                try:
                    self.tokenizer = AutoTokenizer.from_pretrained(self.DISTILBERT_DIR)
                    self.bert_model = AutoModelForSequenceClassification.from_pretrained(self.DISTILBERT_DIR)
                    self.bert_ready = True
                    logger.info("DistilBERT model loaded successfully.")
                except Exception as bert_e:
                    logger.warning(f"DistilBERT exists but failed to load: {str(bert_e)}")
            else:
                logger.warning(f"DistilBERT model not found at {self.DISTILBERT_DIR}.")
            
            if not self.classic_ready and not self.bert_ready:
                self.placeholder_mode = True
                logger.error("No models available. Running in placeholder mode.")
                
        except Exception as e:
            import traceback
            logger.error(f"Error loading models: {str(e)}")
            logger.error(traceback.format_exc())
            self.placeholder_mode = True

    def strip_html(self, text: str) -> str:
        try:
            soup = BeautifulSoup(text, "html.parser")
            return soup.get_text()
        except:
            return text

    def extract_signals(self, text: str) -> Dict[str, Any]:
        signals = {
            "urls_detected": [],
            "urgent_language": [],
            "credential_requests": [],
            "risk_score_base": 0.0
        }
        
        # URL detection (simple regex)
        urls = re.findall(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', text)
        for url in urls:
            is_ip = re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url) is not None
            is_shortened = any(s in url for s in ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly'])
            signals["urls_detected"].append({
                "url": url,
                "is_ip": is_ip,
                "is_shortened": is_shortened,
                "suspicious": is_ip or is_shortened
            })
            if is_ip or is_shortened:
                signals["risk_score_base"] += 0.2

        # Urgency detection
        urgent_keywords = ['urgent', 'immediately', 'suspended', 'closed', 'action required', 'last chance', 'warning', 'important']
        for kw in urgent_keywords:
            if kw.lower() in text.lower():
                signals["urgent_language"].append(kw)
                signals["risk_score_base"] += 0.1

        # Credential requests
        cred_keywords = ['verify your password', 'enter your pin', 'reset link', 'confirm identity', 'secure login']
        for kw in cred_keywords:
            if kw.lower() in text.lower():
                signals["credential_requests"].append(kw)
                signals["risk_score_base"] += 0.15
                
        return signals

    def analyze_email(self, email_text: str, strip_html: bool = True) -> Dict[str, Any]:
        if strip_html:
            clean_text = self.strip_html(email_text)
        else:
            clean_text = email_text

        signals = self.extract_signals(clean_text)
        
        model_scores = {
            "logreg": 0.0,
            "svm": 0.0,
            "distilbert": 0.0
        }
        
        if self.classic_ready:
            vectorized_text = self.vectorizer.transform([clean_text])
            model_scores["logreg"] = float(self.logreg.predict_proba(vectorized_text)[0][1])
            if hasattr(self.svm, 'predict_proba'):
                model_scores["svm"] = float(self.svm.predict_proba(vectorized_text)[0][1])
            else:
                decision = self.svm.decision_function(vectorized_text)[0]
                model_scores["svm"] = 1 / (1 + torch.exp(-torch.tensor(decision)).item())

        if self.bert_ready:
            inputs = self.tokenizer(clean_text, return_tensors="pt", truncation=True, max_length=128)
            with torch.no_grad():
                logits = self.bert_model(**inputs).logits
                model_scores["distilbert"] = torch.softmax(logits, dim=1)[0][1].item()
        
        if self.placeholder_mode:
            heuristic_prob = min(0.7, signals["risk_score_base"])
            model_scores = {
                "logreg": heuristic_prob,
                "svm": heuristic_prob,
                "distilbert": heuristic_prob
            }

        # Dynamic Ensemble Weighting
        if self.classic_ready and self.bert_ready:
            # Production: (30% LogReg, 30% SVM, 40% DistilBERT)
            final_confidence = (0.3 * model_scores["logreg"] + 
                                0.3 * model_scores["svm"] + 
                                0.4 * model_scores["distilbert"])
            model_status = "production"
        elif self.classic_ready:
            # Fallback: 50/50 Classic Ensemble
            final_confidence = (0.5 * model_scores["logreg"] + 0.5 * model_scores["svm"])
            model_status = "classic_ensemble_fallback"
        elif self.bert_ready:
            # Rare case: Only BERT ready
            final_confidence = model_scores["distilbert"]
            model_status = "bert_only"
        else:
            # Placeholder mode
            final_confidence = model_scores["logreg"]
            model_status = "placeholder"

        # Mapping to risk levels
        if final_confidence > 0.7:
            risk_level = "HIGH"
            classification = "PHISHING"
        elif final_confidence > 0.4:
            risk_level = "MEDIUM"
            classification = "SUSPICIOUS"
        else:
            risk_level = "LOW"
            classification = "LEGIT"

        # Generate summary
        summary = "No immediate threats detected."
        if risk_level == "HIGH":
            summary = "High risk phishing attempt detected with strong malicious signals."
        elif risk_level == "MEDIUM":
            summary = "Suspicious elements identified. Exercise caution before clicking any links."

        return {
            "classification": classification,
            "risk_level": risk_level,
            "confidence": final_confidence,
            "model_breakdown": model_scores,
            "signals": signals,
            "explanations": {
                "short_summary": summary,
                "model_status": model_status
            }
        }

# Global instance
phishing_service = PhishingService()

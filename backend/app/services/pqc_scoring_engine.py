import logging
from app.firebase_admin import db
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger(__name__)

class PQCScoringEngine:
    def __init__(self):
        self.points = {
            "correctness": 40,
            "performance": 20,
            "code_quality": 20,
            "security": 20
        }
        
    def submit_challenge_score(self, user_id: str, challenge_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Record a score from a user completing a challenge in the PQC Lab.
        Stores in Firestore `pqc_progress` collection.
        """
        try:
            progress_ref = db.collection('pqc_progress').document(user_id)
            doc = progress_ref.get()
            
            score_delta = challenge_result.get("score_delta", 0)
            
            if doc.exists:
                current_score = doc.to_dict().get("score", 0)
                new_score = current_score + score_delta
                progress_ref.update({
                    "score": new_score,
                    "last_updated": datetime.utcnow()
                })
            else:
                new_score = score_delta
                progress_ref.set({
                    "user_id": user_id,
                    "labs_completed": 0,
                    "score": new_score,
                    "last_updated": datetime.utcnow()
                })
                
            return {"success": True, "new_score": new_score}
        except Exception as e:
            logger.error(f"Error submitting PQC score: {e}")
            return {"success": False, "error": str(e)}

    def record_benchmark(self, user_id: str, benchmark_data: Dict[str, Any]) -> bool:
        """
        Stores benchmarking details in `pqc_benchmarks` collection.
        """
        try:
            benchmark_ref = db.collection('pqc_benchmarks').document()
            benchmark_ref.set({
                "user_id": user_id,
                "algorithm": benchmark_data.get("algorithm"),
                "keygen_time": benchmark_data.get("keygen_time_ms"),
                "encrypt_time": benchmark_data.get("encrypt_time_ms"),
                "decrypt_time": benchmark_data.get("decrypt_time_ms"),
                "public_key_size": benchmark_data.get("public_key_size"),
                "ciphertext_size": benchmark_data.get("ciphertext_size"),
                "timestamp": datetime.utcnow()
            })
            return True
        except Exception as e:
            logger.error(f"Error recording benchmark: {e}")
            return False

    def mark_module_completed(self, user_id: str) -> Dict[str, Any]:
        """
        Awards the 'Quantum Ready' badge if completion logic is met.
        For simplicity, this endpoint triggers the completion.
        """
        try:
            # Update user_progress to include the badge
            user_ref = db.collection('user_progress').document(user_id)
            doc = user_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                badges = data.get("badges", [])
                if "Quantum Ready" not in badges:
                    badges.append("Quantum Ready")
                    user_ref.update({
                        "badges": badges,
                        "labs_completed": data.get("labs_completed", 0) + 1
                    })
            
            return {"success": True, "message": "Module complete. Badge awarded."}
        except Exception as e:
            logger.error(f"Error completing PQC module: {e}")
            return {"success": False, "error": str(e)}

pqc_scoring_engine = PQCScoringEngine()

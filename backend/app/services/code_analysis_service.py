import os
import subprocess
import tempfile
import json
import logging
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CodeAnalysisService:
    def analyze_code(self, code: str, language: str) -> Dict[str, Any]:
        """
        Analyze code for security vulnerabilities using static analysis tools.
        """
        if language.lower() == "python":
            return self._analyze_python(code)
        elif language.lower() == "javascript":
            # Placeholder for JS analysis (e.g., using eslint or semgrep)
            return {
                "vulnerabilities": [],
                "score": 100,
                "summary": "JavaScript analysis not fully implemented in MVP."
            }
        else:
            return {
                "vulnerabilities": [],
                "score": 100,
                "summary": f"Analysis for {language} not supported yet."
            }

    def _analyze_python(self, code: str) -> Dict[str, Any]:
        """
        Run Bandit on Python code.
        """
        vulnerabilities = []
        score = 100
        
        try:
            # Write code to a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
                temp_file.write(code)
                temp_file_path = temp_file.name

            # Run Bandit
            # -f json: Output JSON
            # -q: Quiet
            # --exit-zero: Don't exit with non-zero code on issues
            cmd = ["bandit", "-f", "json", "-q", "--exit-zero", temp_file_path]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.stdout:
                data = json.loads(result.stdout)
                results = data.get("results", [])
                
                for item in results:
                    vulnerabilities.append({
                        "line": item.get("line_number"),
                        "severity": item.get("issue_severity"),
                        "message": item.get("issue_text"),
                        "code": item.get("code"),
                        "more_info": item.get("more_info")
                    })
                    
                # Simple scoring logic
                deduction = len(vulnerabilities) * 10
                score = max(0, 100 - deduction)

            # Cleanup
            os.remove(temp_file_path)
            
            return {
                "vulnerabilities": vulnerabilities,
                "score": score,
                "summary": f"Found {len(vulnerabilities)} potential issues."
            }

        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return {
                "vulnerabilities": [],
                "score": 0,
                "error": str(e)
            }

code_analysis_service = CodeAnalysisService()

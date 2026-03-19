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
        elif language.lower() in ["javascript", "js"]:
            return self._analyze_semgrep(code, "p/javascript", ".js")
        elif language.lower() == "html":
            return self._analyze_semgrep(code, "p/html", ".html")
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

    def _analyze_semgrep(self, code: str, config: str, suffix: str) -> Dict[str, Any]:
        """
        Run Semgrep on code with specific config.
        """
        vulnerabilities = []
        score = 100
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix=suffix, delete=False) as temp_file:
                temp_file.write(code)
                temp_file_path = temp_file.name

            # Resolve the absolute path to the custom rules file
            custom_rules_path = os.path.join(os.path.dirname(__file__), "custom_semgrep_rules.yaml")
            cmd = ["semgrep", "scan", "--config", config, "--config", custom_rules_path, "--json", "--quiet", temp_file_path]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.stdout:
                data = json.loads(result.stdout)
                results = data.get("results", [])
                
                # Split code to extract lines manually since semgrep might redact lines with 'requires login'
                code_lines = code.splitlines()
                
                for item in results:
                    cwe_info = item.get("extra", {}).get("metadata", {}).get("cwe")
                    if isinstance(cwe_info, list) and len(cwe_info) > 0:
                        more_info = cwe_info[0]
                    elif isinstance(cwe_info, str):
                        more_info = cwe_info
                    else:
                        more_info = item.get("check_id", "")

                    line_num = item.get("start", {}).get("line")
                    snippet = ""
                    if line_num and 1 <= line_num <= len(code_lines):
                        snippet = code_lines[line_num - 1].strip()

                    vulnerabilities.append({
                        "line": line_num,
                        "severity": item.get("extra", {}).get("severity"),
                        "message": item.get("extra", {}).get("message"),
                        "code": snippet,
                        "more_info": more_info
                    })
                    
                deduction = len(vulnerabilities) * 10
                score = max(0, 100 - deduction)

            os.remove(temp_file_path)
            
            return {
                "vulnerabilities": vulnerabilities,
                "score": score,
                "summary": f"Found {len(vulnerabilities)} potential issues."
            }

        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return {
                "vulnerabilities": [],
                "score": 0,
                "error": str(e)
            }

code_analysis_service = CodeAnalysisService()

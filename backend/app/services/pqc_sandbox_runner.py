import docker
import os
import tempfile
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class PQCSandboxRunner:
    def __init__(self):
        try:
            self.client = docker.from_env()
            self.available = True
        except Exception as e:
            logger.error(f"Failed to connect to Docker for PQC Sandbox: {e}")
            self.available = False
            
    def is_available(self) -> bool:
        return self.available

    def execute_script(self, script_content: str, timeout: int = 5) -> Dict[str, Any]:
        """
        Executes a python script inside the isolated PQC Docker container.
        Returns execution time and JSON output if available.
        """
        if not self.available:
            return {"error": "PQC Sandbox unavailable. Docker is not running."}

        # Create a temporary file with the script content
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
            temp_file.write(script_content)
            temp_file_path = temp_file.name

        container = None
        try:
            # Run the container with strict limits
            container = self.client.containers.run(
                image="codelife-pqc-base:latest",
                command=["python3", "/tmp/script.py"],
                volumes={temp_file_path: {'bind': '/tmp/script.py', 'mode': 'ro'}},
                detach=True,
                mem_limit="256m",
                nano_cpus=500000000, # 0.5 CPU
                network_mode="none",
                read_only=True,
                pids_limit=50
            )

            # Wait for execution to finish (with timeout)
            result = container.wait(timeout=timeout)
            
            # Fetch logs
            logs = container.logs().decode('utf-8')
            
            if result['StatusCode'] != 0:
                return {
                    "success": False,
                    "error": f"Execution failed (Code {result['StatusCode']})",
                    "logs": logs
                }

            # Attempt to parse output as JSON (expected format for benchmark tools)
            try:
                # Find the last valid JSON object in the logs
                json_lines = [line for line in logs.split('\n') if line.strip().startswith('{') and line.strip().endswith('}')]
                if json_lines:
                    parsed_output = json.loads(json_lines[-1])
                    return {"success": True, "data": parsed_output, "logs": logs}
                else:
                    return {"success": True, "data": {}, "logs": logs}
            except json.JSONDecodeError:
                return {"success": True, "data": {}, "logs": logs, "warning": "Output was not valid JSON"}

        except Exception as e:
            logger.error(f"PQC Sandbox execution error: {str(e)}")
            return {"success": False, "error": str(e)}
        finally:
            if container:
                try:
                    container.remove(force=True)
                except Exception as e:
                    logger.error(f"Failed to remove PQC container: {str(e)}")
            
            # Cleanup temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

pqc_sandbox = PQCSandboxRunner()

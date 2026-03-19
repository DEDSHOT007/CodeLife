import docker
import logging
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SandboxService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SandboxService, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "initialized", False):
            return
            
        try:
            self.client = docker.from_env()
            self.client.ping()
            logger.info("SandboxService initialized. Docker connection successful.")
            self.docker_available = True
        except Exception as e:
            logger.error(f"Failed to connect to Docker: {str(e)}")
            self.client = None
            self.docker_available = False
            
        self.initialized = True

    def is_available(self) -> bool:
        return self.docker_available

    def start_lab(self, user_id: str, lab_id: str) -> Dict[str, Any]:
        """
        Start a lab container for a user.
        """
        if not self.docker_available:
            raise Exception("Docker environment is not available.")
            
        container_name = f"lab_{user_id}_{lab_id}"
        
        try:
            # Check if already running
            existing = self.client.containers.list(filters={"name": container_name})
            if existing:
                return {
                    "container_id": existing[0].id,
                    "status": "running",
                    "url": "http://localhost:7681" # Todo: Dynamic port mapping
                }

            # Run new container
            # Using ttyd on port 7681 inside container
            # Mapping to a random host port or fixed range
            # For MVP, mapping 7681->7681 (single user/local dev limitation)
            container = self.client.containers.run(
                "codelife-lab-base:latest", # Assuming image is built
                detach=True,
                name=container_name,
                ports={'7681/tcp': 7681},
                remove=True # Auto remove on stop
            )
            
            return {
                "container_id": container.id,
                "status": "started",
                "url": "http://localhost:7681"
            }
            
        except Exception as e:
            logger.error(f"Error starting lab: {str(e)}")
            raise e

    def stop_lab(self, container_id: str):
        if not self.docker_available:
            return
            
        try:
            container = self.client.containers.get(container_id)
            container.stop()
        except docker.errors.NotFound:
            pass # Already gone
        except Exception as e:
            logger.error(f"Error stopping lab: {str(e)}")
            raise e

sandbox_service = SandboxService()

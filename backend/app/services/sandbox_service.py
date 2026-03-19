import docker
from docker.errors import APIError, NotFound, DockerException
import json
import secrets
import socket
import logging
from typing import Dict, Optional, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class SandboxManager:
    """
    Manages Docker-based vulnerable web application sandboxes.
    Replaces terminal-based approach with pre-built vulnerable apps.
    """
    
    def __init__(self):
        self.client = None
        self.container_prefix = "codelife_sandbox_"
        self.network_name = "codelife_network"
        self.scenarios = []
        
        # Initialize Docker client
        self._initialize_docker()
        
        # Load scenario configurations
        self._load_scenarios()
        
        # Ensure network exists
        if self.client:
            self._ensure_network()
    
    def _initialize_docker(self):
        """Initialize Docker client with error handling."""
        try:
            self.client = docker.from_env()
            # Test connection
            self.client.ping()
            logger.info("Docker client initialized successfully")
        except DockerException as e:
            logger.error(f"Failed to initialize Docker client: {str(e)}")
            self.client = None
        except Exception as e:
            logger.error(f"Unexpected error initializing Docker: {str(e)}")
            self.client = None
    
    def is_docker_available(self) -> bool:
        """Check if Docker is available and responsive."""
        if not self.client:
            return False
        try:
            self.client.ping()
            return True
        except:
            return False
    
    def _load_scenarios(self):
        """Load scenario configurations from JSON file."""
        try:
            # Look for scenarios file in config directory
            config_path = Path(__file__).parent.parent.parent / "config" / "sandbox_scenarios.json"
            
            if config_path.exists():
                with open(config_path, 'r') as f:
                    data = json.load(f)
                    self.scenarios = data.get("scenarios", [])
                logger.info(f"Loaded {len(self.scenarios)} sandbox scenarios")
            else:
                logger.warning(f"Scenarios file not found at {config_path}")
                # Fallback to hardcoded scenarios
                self._load_default_scenarios()
                
        except Exception as e:
            logger.error(f"Failed to load scenarios: {str(e)}")
            self._load_default_scenarios()
    
    def _load_default_scenarios(self):
        """Fallback scenarios if config file not found."""
        self.scenarios = [
            {
                "id": "juice-shop",
                "name": "OWASP Juice Shop",
                "description": "Modern intentionally insecure web application with 100+ challenges",
                "difficulty": "beginner-advanced",
                "docker_image": "bkimminich/juice-shop:latest",
                "port": 3000,
                "categories": ["web", "injection", "xss", "authentication"],
                "estimated_time": "2-4 hours",
                "challenges": [
                    {
                        "id": "score-board",
                        "name": "Find the Score Board",
                        "difficulty": "beginner",
                        "hint": "Try exploring the application's routes"
                    }
                ]
            },
            {
                "id": "dvwa",
                "name": "Damn Vulnerable Web App",
                "description": "Classic vulnerable PHP application for learning",
                "difficulty": "beginner-intermediate",
                "docker_image": "vulnerables/web-dvwa:latest",
                "port": 80,
                "categories": ["sql-injection", "xss", "csrf"],
                "estimated_time": "3-5 hours",
                "default_credentials": {
                    "username": "admin",
                    "password": "password"
                },
                "challenges": []
            }
        ]
        logger.info("Loaded default fallback scenarios")
    
    def _ensure_network(self):
        """Ensure CodeLife Docker network exists."""
        if not self.client:
            return
            
        try:
            self.client.networks.get(self.network_name)
            logger.info(f"Network {self.network_name} already exists")
        except NotFound:
            try:
                self.client.networks.create(
                    self.network_name,
                    driver="bridge"
                )
                logger.info(f"Created network {self.network_name}")
            except Exception as e:
                logger.error(f"Failed to create network: {str(e)}")
    
    def get_available_scenarios(self) -> List[Dict]:
        """Get list of all available scenarios."""
        return self.scenarios
    
    def get_scenario_by_id(self, scenario_id: str) -> Optional[Dict]:
        """Get scenario details by ID."""
        return next((s for s in self.scenarios if s["id"] == scenario_id), None)
    
    async def launch_sandbox(
        self, 
        user_id: str, 
        scenario_id: str,
        db
    ) -> Dict:
        """
        Launch a new sandbox environment.
        
        Args:
            user_id: User's unique identifier
            scenario_id: ID of the scenario to launch
            db: Firestore database client
            
        Returns:
            Dictionary with sandbox information including access URL
        """
        if not self.is_docker_available():
            raise Exception("Docker service is unavailable")
        
        # Get scenario configuration
        scenario = self.get_scenario_by_id(scenario_id)
        if not scenario:
            raise ValueError(f"Scenario '{scenario_id}' not found")
        
        # Check if user already has this sandbox running
        existing = await self._get_user_sandbox(user_id, scenario_id, db)
        if existing:
            logger.info(f"User {user_id} already has {scenario_id} running")
            return existing
        
        # Generate unique container name
        container_name = f"{self.container_prefix}{user_id}_{scenario_id}_{secrets.token_hex(4)}"
        
        try:
            # Find a free host port manually since docker SDK auto-mapping is failing on this network
            host_port = self._get_free_port()
            
            # Pull image if not exists
            self._ensure_image(scenario["docker_image"])
            
            # Create and start container on default bridge network
            container = self.client.containers.run(
                scenario["docker_image"],
                name=container_name,
                detach=True,
                ports={f"{scenario['port']}/tcp": host_port},  # Explicitly bind to found port
                environment={
                    "CODELIFE_USER_ID": user_id,
                    "CODELIFE_SCENARIO": scenario_id
                },
                labels={
                    "codelife.user_id": user_id,
                    "codelife.scenario_id": scenario_id,
                    "codelife.created_at": datetime.utcnow().isoformat()
                },
                restart_policy={"Name": "no"},  # Don't auto-restart
                remove=False  # Don't auto-remove when stopped
            )
            
            # Note: We already know host_port because we assigned it explicitly
            # Calculate expiry time (4 hours from now)
            expires_at = datetime.utcnow() + timedelta(hours=4)
            
            # Prepare sandbox data
            sandbox_data = {
                "user_id": user_id,
                "scenario_id": scenario_id,
                "container_id": container.id,
                "container_name": container_name,
                "host_port": int(host_port),
                "scenario_port": scenario["port"],
                "status": "running",
                "created_at": datetime.utcnow().isoformat(),
                "expires_at": expires_at.isoformat(),
                "access_url": f"http://localhost:{host_port}",
                "scenario_name": scenario["name"],
                "difficulty": scenario["difficulty"]
            }
            
            # Save to Firestore
            db.collection("sandbox_sessions").document(container_name).set(sandbox_data)
            
            # Update user's sandbox history
            await self._update_user_history(db, user_id, scenario_id)
            
            logger.info(f"Launched sandbox {container_name} on port {host_port}")
            
            return sandbox_data
            
        except APIError as e:
            logger.error(f"Docker API error launching sandbox: {str(e)}")
            raise Exception(f"Failed to launch sandbox: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error launching sandbox: {str(e)}")
            raise Exception(f"Failed to launch sandbox: {str(e)}")
    
    def _ensure_image(self, image_name: str):
        """Ensure Docker image exists, pull if not."""
        try:
            self.client.images.get(image_name)
            logger.info(f"Image {image_name} already exists")
        except NotFound:
            logger.info(f"Pulling image {image_name}...")
            try:
                self.client.images.pull(image_name)
                logger.info(f"Successfully pulled {image_name}")
            except Exception as e:
                logger.error(f"Failed to pull image {image_name}: {str(e)}")
                raise Exception(f"Failed to pull Docker image: {str(e)}")
    
    async def stop_sandbox(self, container_name: str, db) -> Dict:
        """Stop and remove a sandbox container."""
        if not self.is_docker_available():
            raise Exception("Docker service is unavailable")
        
        try:
            container = self.client.containers.get(container_name)
            container.stop(timeout=10)
            container.remove()
            
            # Update Firestore
            doc_ref = db.collection("sandbox_sessions").document(container_name)
            doc_ref.update({
                "status": "stopped",
                "stopped_at": datetime.utcnow().isoformat()
            })
            
            logger.info(f"Stopped and removed sandbox {container_name}")
            
            return {"status": "stopped", "container_name": container_name}
            
        except NotFound:
            logger.warning(f"Container {container_name} not found")
            return {"status": "not_found", "container_name": container_name}
        except Exception as e:
            logger.error(f"Failed to stop sandbox {container_name}: {str(e)}")
            raise Exception(f"Failed to stop sandbox: {str(e)}")
    
    async def get_sandbox_status(self, container_name: str) -> Dict:
        """Get current status of a sandbox."""
        if not self.is_docker_available():
            return {"status": "docker_unavailable"}
        
        try:
            container = self.client.containers.get(container_name)
            container.reload()
            
            return {
                "status": container.status,
                "created": container.attrs['Created'],
                "ports": container.attrs['NetworkSettings']['Ports']
            }
        except NotFound:
            return {"status": "not_found"}
        except Exception as e:
            logger.error(f"Error getting status for {container_name}: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def list_user_sandboxes(self, user_id: str) -> List[Dict]:
        """List all active sandboxes for a user."""
        if not self.is_docker_available():
            return []
        
        try:
            containers = self.client.containers.list(
                filters={
                    "label": f"codelife.user_id={user_id}",
                    "status": "running"
                }
            )
            
            return [
                {
                    "id": c.id,
                    "container_name": c.name,
                    "scenario_id": c.labels.get("codelife.scenario_id"),
                    "created_at": c.labels.get("codelife.created_at"),
                    "status": c.status
                }
                for c in containers
            ]
        except Exception as e:
            logger.error(f"Failed to list sandboxes for user {user_id}: {str(e)}")
            return []
    
    async def extend_sandbox_time(self, container_name: str, hours: int, db) -> Dict:
        """Extend sandbox expiry time."""
        try:
            doc_ref = db.collection("sandbox_sessions").document(container_name)
            doc = doc_ref.get()
            
            if not doc.exists:
                raise Exception("Sandbox not found in database")
            
            new_expiry = datetime.utcnow() + timedelta(hours=hours)
            doc_ref.update({"expires_at": new_expiry})
            
            logger.info(f"Extended {container_name} by {hours} hours")
            
            return {"expires_at": new_expiry.isoformat()}
            
        except Exception as e:
            logger.error(f"Failed to extend time for {container_name}: {str(e)}")
            raise Exception(f"Failed to extend time: {str(e)}")
    
    async def cleanup_expired_sandboxes(self, db):
        """Clean up all expired sandboxes."""
        if not self.is_docker_available():
            logger.warning("Docker unavailable, skipping cleanup")
            return
        
        try:
            cutoff = datetime.utcnow()
            
            # Query expired sessions
            expired_docs = (
                db.collection("sandbox_sessions")
                .where("status", "==", "running")
                .where("expires_at", "<=", cutoff)
                .stream()
            )
            
            for doc in expired_docs:
                data = doc.to_dict()
                container_name = data["container_name"]
                
                try:
                    await self.stop_sandbox(container_name, db)
                    logger.info(f"Cleaned up expired sandbox {container_name}")
                except Exception as e:
                    logger.error(f"Failed to cleanup {container_name}: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
    
    async def _get_user_sandbox(self, user_id: str, scenario_id: str, db) -> Optional[Dict]:
        """Check if user already has this sandbox running and return the full data dictionary."""
        try:
            # Query the running session from Firestore to get full details (expires_at, access_url, etc)
            docs = (
                db.collection("sandbox_sessions")
                .where("user_id", "==", user_id)
                .where("scenario_id", "==", scenario_id)
                .where("status", "==", "running")
                .limit(1)
                .stream()
            )
            
            for doc in docs:
                data = doc.to_dict()
                # Ensure datetimes are ISO strings for the JSON response
                if isinstance(data.get("expires_at"), datetime):
                    data["expires_at"] = data["expires_at"].isoformat()
                elif hasattr(data.get("expires_at"), "isoformat"):
                    # Handles Google Cloud Firestore DatetimeWithNanoseconds objects
                    data["expires_at"] = data["expires_at"].isoformat()
                    
                if isinstance(data.get("created_at"), datetime):
                    data["created_at"] = data["created_at"].isoformat()
                elif hasattr(data.get("created_at"), "isoformat"):
                    data["created_at"] = data["created_at"].isoformat()
                    
                return data
                
            return None
        except Exception as e:
            logger.error(f"Failed querying existing sandbox for {user_id}: {str(e)}")
            return None
            
    def _get_free_port(self) -> int:
        """Find an available port on the host machine."""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            port = s.getsockname()[1]
            return port
    
    async def _update_user_history(self, db, user_id: str, scenario_id: str):
        """Update user's sandbox usage history."""
        from google.cloud.firestore import Increment
        
        doc_ref = db.collection("sandbox_history").document(user_id)
        
        doc_ref.set({
            "total_sessions": Increment(1),
            f"scenarios.{scenario_id}": Increment(1),
            "last_accessed": datetime.utcnow().isoformat()
        }, merge=True)

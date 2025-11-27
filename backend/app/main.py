from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.routers import protected
from app.routers import courses_firestore
from app.routers import pentesting
import app.firebase_admin  # Initialize Firebase Admin on startup

app = FastAPI(
    title="CodeLife API",
    description="Backend API for CodeLife cybersecurity platform",
    version="0.1.0"
)

# Initialize rate limiter for the app
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(protected.router)
app.include_router(courses_firestore.router)  # Firestore courses router
app.include_router(pentesting.router)  # Pentesting toolkit router


@app.get("/")
async def root():
    return {
        "message": "CodeLife API is running",
        "version": "0.1.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import protected
from app.routers import courses_firestore
import app.firebase_admin  # Initialize Firebase Admin on startup

app = FastAPI(
    title="CodeLife API",
    description="Backend API for CodeLife cybersecurity platform",
    version="0.1.0"
)

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
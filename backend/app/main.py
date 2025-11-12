# from fastapi import FastAPI

# app = FastAPI()

# @app.get("/")
# async def root():
#     return {"message": "CodeLife backend is up"}
# from app.routers import protected

# app.include_router(protected.router, prefix="/user", tags=["user"])
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import protected
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
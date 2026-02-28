"""
College Event & Club Hub — FastAPI Backend
Main application entry point with CORS, router mounting, and health check.
"""

import os
import sys
from pathlib import Path

# Ensure the backend directory is in Python's path (required for Vercel deployment)
BACKEND_DIR = str(Path(__file__).resolve().parent)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from auth.google_oauth import router as auth_router
from api.events import router as events_router
from api.clubs import router as clubs_router
from api.registrations import router as registrations_router

# ============================================================
# App Configuration
# ============================================================

app = FastAPI(
    title="College Event & Club Hub API",
    description="Backend API for managing college events, clubs, registrations, and authentication.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============================================================
# CORS Middleware
# Allow frontend origins for cross-origin requests
# ============================================================

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS + ["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Mount Routers
# All routes are prefixed with /api
# ============================================================

app.include_router(auth_router, prefix="/api")
app.include_router(events_router, prefix="/api")
app.include_router(clubs_router, prefix="/api")
app.include_router(registrations_router, prefix="/api")


# ============================================================
# Root & Health Check Endpoints
# ============================================================

@app.get("/")
async def root():
    """Root endpoint — API status check."""
    return {
        "message": "College Event & Club Hub API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}


# ============================================================
# Vercel Serverless Handler
# ============================================================

# For Vercel deployment, the app is exported as 'app'
# Vercel automatically picks up the FastAPI app

"""
Google OAuth Authentication Handler
Handles Google ID token verification and JWT session management.
"""

import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Header
from jose import jwt, JWTError
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv

from database.supabase_client import supabase
from models.schemas import GoogleLoginRequest, AuthResponse, UserResponse, MessageResponse

load_dotenv()

# Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ============================================================
# Helper Functions
# ============================================================

def create_jwt_token(user_data: dict) -> str:
    """
    Creates a JWT token with user data and expiration.
    
    Args:
        user_data: Dictionary containing user information (id, email, role)
    
    Returns:
        Encoded JWT token string
    """
    payload = {
        "sub": user_data["id"],
        "email": user_data["email"],
        "role": user_data.get("role", "student"),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str) -> dict:
    """
    Verifies and decodes a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Dependency that extracts and verifies the current user from the Authorization header.
    
    Args:
        authorization: Bearer token from request header
    
    Returns:
        User payload from JWT token
    
    Raises:
        HTTPException: If no token provided or token is invalid
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = verify_jwt_token(token)
    
    # Fetch user from database to ensure they still exist
    if supabase:
        result = supabase.table("users").select("*").eq("id", payload["sub"]).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="User not found")
        return result.data[0]
    
    return payload


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency that ensures the current user has admin role.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User data if admin
    
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ============================================================
# Routes
# ============================================================

@router.post("/google-login", response_model=AuthResponse)
async def google_login(request: GoogleLoginRequest):
    """
    Authenticate user via Google ID token.
    
    1. Verifies the Google ID token
    2. Creates or updates user in database
    3. Returns JWT session token
    """
    try:
        # Verify Google ID token
        idinfo = id_token.verify_oauth2_token(
            request.token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # Extract user info from Google token
        google_id = idinfo["sub"]
        email = idinfo.get("email", "")
        name = idinfo.get("name", "")
        avatar_url = idinfo.get("picture", "")

        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")

        # Check if user already exists
        existing = supabase.table("users").select("*").eq("google_id", google_id).execute()

        if existing.data:
            # Update existing user info
            user = existing.data[0]
            supabase.table("users").update({
                "name": name,
                "avatar_url": avatar_url
            }).eq("id", user["id"]).execute()
        else:
            # Create new user
            new_user = {
                "email": email,
                "name": name,
                "avatar_url": avatar_url,
                "google_id": google_id,
                "role": "student"
            }
            result = supabase.table("users").insert(new_user).execute()
            user = result.data[0]

        # Generate JWT token
        access_token = create_jwt_token(user)

        return AuthResponse(
            access_token=access_token,
            user=UserResponse(
                id=user["id"],
                email=user["email"],
                name=user["name"],
                avatar_url=user.get("avatar_url"),
                role=user["role"]
            )
        )

    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Returns the current authenticated user's information.
    """
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        avatar_url=current_user.get("avatar_url"),
        role=current_user["role"],
        created_at=current_user.get("created_at")
    )


@router.post("/logout", response_model=MessageResponse)
async def logout():
    """
    Logout endpoint. Since we use JWT tokens, logout is handled client-side
    by removing the token. This endpoint just confirms the action.
    """
    return MessageResponse(message="Logged out successfully")


@router.put("/make-admin/{user_id}", response_model=MessageResponse)
async def make_admin(user_id: str, admin: dict = Depends(require_admin)):
    """
    Promotes a user to admin role. Requires admin access.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    supabase.table("users").update({"role": "admin"}).eq("id", user_id).execute()
    return MessageResponse(message="User promoted to admin")

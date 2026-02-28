"""
Pydantic Models (Schemas)
Request/response models for all API endpoints.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============================================================
# Enums
# ============================================================

class UserRole(str, Enum):
    """User role types"""
    STUDENT = "student"
    ADMIN = "admin"


class EventCategory(str, Enum):
    """Event category types"""
    TECHNICAL = "Technical"
    CULTURAL = "Cultural"
    SPORTS = "Sports"


class EventStatus(str, Enum):
    """Event status types"""
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# ============================================================
# User Schemas
# ============================================================

class UserBase(BaseModel):
    """Base user schema"""
    email: str
    name: str
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a user"""
    google_id: str
    role: UserRole = UserRole.STUDENT


class UserResponse(UserBase):
    """Schema for user response"""
    id: str
    role: UserRole
    google_id: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user"""
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None


# ============================================================
# Event Schemas
# ============================================================

class EventBase(BaseModel):
    """Base event schema"""
    title: str
    description: Optional[str] = None
    category: EventCategory
    event_date: str
    venue: str
    poster_url: Optional[str] = None
    max_participants: Optional[int] = None


class EventCreate(EventBase):
    """Schema for creating an event"""
    pass


class EventUpdate(BaseModel):
    """Schema for updating an event"""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[EventCategory] = None
    event_date: Optional[str] = None
    venue: Optional[str] = None
    poster_url: Optional[str] = None
    status: Optional[EventStatus] = None
    max_participants: Optional[int] = None


class EventResponse(EventBase):
    """Schema for event response"""
    id: str
    created_by: Optional[str] = None
    status: EventStatus = EventStatus.UPCOMING
    created_at: Optional[str] = None
    registration_count: Optional[int] = 0
    is_registered: Optional[bool] = False

    class Config:
        from_attributes = True


# ============================================================
# Club Schemas
# ============================================================

class ClubBase(BaseModel):
    """Base club schema"""
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    category: Optional[str] = None


class ClubCreate(ClubBase):
    """Schema for creating a club"""
    pass


class ClubUpdate(BaseModel):
    """Schema for updating a club"""
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    category: Optional[str] = None


class ClubResponse(ClubBase):
    """Schema for club response"""
    id: str
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    member_count: Optional[int] = 0
    is_member: Optional[bool] = False

    class Config:
        from_attributes = True


# ============================================================
# Registration Schemas
# ============================================================

class EventRegistrationResponse(BaseModel):
    """Schema for event registration response"""
    id: str
    user_id: str
    event_id: str
    registered_at: Optional[str] = None
    event: Optional[EventResponse] = None
    user: Optional[UserResponse] = None


class ClubMembershipResponse(BaseModel):
    """Schema for club membership response"""
    id: str
    user_id: str
    club_id: str
    joined_at: Optional[str] = None
    club: Optional[ClubResponse] = None
    user: Optional[UserResponse] = None


# ============================================================
# Announcement Schemas
# ============================================================

class AnnouncementCreate(BaseModel):
    """Schema for creating a club announcement"""
    title: str
    content: str


class AnnouncementResponse(BaseModel):
    """Schema for announcement response"""
    id: str
    club_id: str
    title: str
    content: str
    created_by: Optional[str] = None
    created_at: Optional[str] = None


# ============================================================
# Auth Schemas
# ============================================================

class GoogleLoginRequest(BaseModel):
    """Schema for Google login request — receives the ID token from frontend"""
    token: str


class AuthResponse(BaseModel):
    """Schema for auth response — returns JWT + user info"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============================================================
# Generic Schemas
# ============================================================

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    data: list
    total: int
    page: int
    per_page: int

"""
Registration API Endpoints
Event registration and club membership management.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Depends

from database.supabase_client import supabase
from auth.google_oauth import get_current_user, require_admin
from models.schemas import (
    EventRegistrationResponse, ClubMembershipResponse,
    EventResponse, ClubResponse, MessageResponse, UserResponse
)

router = APIRouter(prefix="/registrations", tags=["Registrations"])


# ============================================================
# Event Registration Endpoints
# ============================================================

@router.post("/events/{event_id}", response_model=MessageResponse)
async def register_for_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """
    Register the current user for an event.
    Checks for duplicate registration and max participant limits.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Check if event exists
    event = supabase.table("events").select("*").eq("id", event_id).execute()
    if not event.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already registered
    existing = supabase.table("event_registrations").select("*").eq(
        "user_id", current_user["id"]
    ).eq("event_id", event_id).execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Already registered for this event")
    
    # Check max participants
    event_data = event.data[0]
    if event_data.get("max_participants"):
        current_count = supabase.table("event_registrations").select(
            "id", count="exact"
        ).eq("event_id", event_id).execute()
        
        if current_count.count >= event_data["max_participants"]:
            raise HTTPException(status_code=400, detail="Event is full")
    
    # Register user
    supabase.table("event_registrations").insert({
        "user_id": current_user["id"],
        "event_id": event_id
    }).execute()
    
    return MessageResponse(message="Successfully registered for event")


@router.delete("/events/{event_id}", response_model=MessageResponse)
async def unregister_from_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """
    Unregister the current user from an event.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("event_registrations").delete().eq(
        "user_id", current_user["id"]
    ).eq("event_id", event_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    return MessageResponse(message="Successfully unregistered from event")


@router.get("/events/my", response_model=List[EventRegistrationResponse])
async def get_my_event_registrations(current_user: dict = Depends(get_current_user)):
    """
    Get all event registrations for the current user.
    Includes full event details for each registration.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    registrations = supabase.table("event_registrations").select("*").eq(
        "user_id", current_user["id"]
    ).order("registered_at", desc=True).execute()
    
    result = []
    for reg in registrations.data:
        # Fetch event details
        event = supabase.table("events").select("*").eq("id", reg["event_id"]).execute()
        event_data = None
        if event.data:
            e = event.data[0]
            event_data = EventResponse(
                id=e["id"],
                title=e["title"],
                description=e.get("description"),
                category=e["category"],
                event_date=e["event_date"],
                venue=e["venue"],
                poster_url=e.get("poster_url"),
                status=e.get("status", "upcoming"),
                created_at=e.get("created_at")
            )
        
        result.append(EventRegistrationResponse(
            id=reg["id"],
            user_id=reg["user_id"],
            event_id=reg["event_id"],
            registered_at=reg.get("registered_at"),
            event=event_data
        ))
    
    return result


# ============================================================
# Club Membership Endpoints
# ============================================================

@router.post("/clubs/{club_id}", response_model=MessageResponse)
async def join_club(club_id: str, current_user: dict = Depends(get_current_user)):
    """
    Join a club as the current user.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Check if club exists
    club = supabase.table("clubs").select("*").eq("id", club_id).execute()
    if not club.data:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Check if already a member
    existing = supabase.table("club_memberships").select("*").eq(
        "user_id", current_user["id"]
    ).eq("club_id", club_id).execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Already a member of this club")
    
    # Join club
    supabase.table("club_memberships").insert({
        "user_id": current_user["id"],
        "club_id": club_id
    }).execute()
    
    return MessageResponse(message="Successfully joined club")


@router.delete("/clubs/{club_id}", response_model=MessageResponse)
async def leave_club(club_id: str, current_user: dict = Depends(get_current_user)):
    """
    Leave a club as the current user.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("club_memberships").delete().eq(
        "user_id", current_user["id"]
    ).eq("club_id", club_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    return MessageResponse(message="Successfully left club")


@router.get("/clubs/my", response_model=List[ClubMembershipResponse])
async def get_my_club_memberships(current_user: dict = Depends(get_current_user)):
    """
    Get all club memberships for the current user.
    Includes full club details for each membership.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    memberships = supabase.table("club_memberships").select("*").eq(
        "user_id", current_user["id"]
    ).order("joined_at", desc=True).execute()
    
    result = []
    for mem in memberships.data:
        # Fetch club details
        club = supabase.table("clubs").select("*").eq("id", mem["club_id"]).execute()
        club_data = None
        if club.data:
            c = club.data[0]
            club_data = ClubResponse(
                id=c["id"],
                name=c["name"],
                description=c.get("description"),
                logo_url=c.get("logo_url"),
                category=c.get("category"),
                created_at=c.get("created_at")
            )
        
        result.append(ClubMembershipResponse(
            id=mem["id"],
            user_id=mem["user_id"],
            club_id=mem["club_id"],
            joined_at=mem.get("joined_at"),
            club=club_data
        ))
    
    return result


# ============================================================
# Admin Endpoints
# ============================================================

@router.get("/events/{event_id}/users")
async def get_event_registrations(event_id: str, admin: dict = Depends(require_admin)):
    """
    Get all registered users for an event. Requires admin access.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    registrations = supabase.table("event_registrations").select("*").eq(
        "event_id", event_id
    ).execute()
    
    users = []
    for reg in registrations.data:
        user = supabase.table("users").select("id, name, email, avatar_url").eq(
            "id", reg["user_id"]
        ).execute()
        if user.data:
            users.append({
                "registration_id": reg["id"],
                "registered_at": reg["registered_at"],
                "user": user.data[0]
            })
    
    return users


@router.get("/admin/all-users")
async def get_all_users(admin: dict = Depends(require_admin)):
    """
    Get all registered users. Requires admin access.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("users").select("*").order("created_at", desc=True).execute()
    
    return [UserResponse(
        id=u["id"],
        email=u["email"],
        name=u["name"],
        avatar_url=u.get("avatar_url"),
        role=u["role"],
        created_at=u.get("created_at")
    ) for u in result.data]

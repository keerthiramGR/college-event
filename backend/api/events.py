"""
Event API Endpoints
CRUD operations for college events with category filtering and registration counts.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query

from database.supabase_client import supabase
from auth.google_oauth import get_current_user, require_admin
from models.schemas import (
    EventCreate, EventUpdate, EventResponse, 
    MessageResponse, EventCategory, EventStatus
)

router = APIRouter(prefix="/events", tags=["Events"])


# ============================================================
# Public Endpoints
# ============================================================

@router.get("", response_model=List[EventResponse])
async def get_events(
    category: Optional[EventCategory] = None,
    status: Optional[EventStatus] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0)
):
    """
    Get all events with optional filtering by category, status, and search term.
    Returns events sorted by date (newest first).
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = supabase.table("events").select("*")
    
    # Apply filters
    if category:
        query = query.eq("category", category.value)
    if status:
        query = query.eq("status", status.value)
    if search:
        query = query.ilike("title", f"%{search}%")
    
    # Execute query with pagination
    result = query.order("event_date", desc=False).range(offset, offset + limit - 1).execute()
    
    # Get registration counts for each event
    events = []
    for event in result.data:
        reg_count = supabase.table("event_registrations").select(
            "id", count="exact"
        ).eq("event_id", event["id"]).execute()
        
        events.append(EventResponse(
            id=event["id"],
            title=event["title"],
            description=event.get("description"),
            category=event["category"],
            event_date=event["event_date"],
            venue=event["venue"],
            poster_url=event.get("poster_url"),
            created_by=event.get("created_by"),
            status=event.get("status", "upcoming"),
            max_participants=event.get("max_participants"),
            created_at=event.get("created_at"),
            registration_count=reg_count.count or 0
        ))
    
    return events


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    """
    Get a single event by ID with its registration count.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("events").select("*").eq("id", event_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event = result.data[0]
    
    # Get registration count
    reg_count = supabase.table("event_registrations").select(
        "id", count="exact"
    ).eq("event_id", event_id).execute()
    
    return EventResponse(
        id=event["id"],
        title=event["title"],
        description=event.get("description"),
        category=event["category"],
        event_date=event["event_date"],
        venue=event["venue"],
        poster_url=event.get("poster_url"),
        created_by=event.get("created_by"),
        status=event.get("status", "upcoming"),
        max_participants=event.get("max_participants"),
        created_at=event.get("created_at"),
        registration_count=reg_count.count or 0
    )


# ============================================================
# Admin Endpoints
# ============================================================

@router.post("", response_model=EventResponse)
async def create_event(event: EventCreate, current_user: dict = Depends(require_admin)):
    """
    Create a new event. Requires admin access.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    event_data = event.model_dump()
    event_data["created_by"] = current_user["id"]
    event_data["status"] = "upcoming"
    
    result = supabase.table("events").insert(event_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create event")
    
    created = result.data[0]
    return EventResponse(
        id=created["id"],
        title=created["title"],
        description=created.get("description"),
        category=created["category"],
        event_date=created["event_date"],
        venue=created["venue"],
        poster_url=created.get("poster_url"),
        created_by=created.get("created_by"),
        status=created.get("status", "upcoming"),
        max_participants=created.get("max_participants"),
        created_at=created.get("created_at"),
        registration_count=0
    )


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, event: EventUpdate, admin: dict = Depends(require_admin)):
    """
    Update an existing event. Requires admin access.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Filter out None values
    update_data = {k: v for k, v in event.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Convert enum values to strings
    if "category" in update_data:
        update_data["category"] = update_data["category"].value if hasattr(update_data["category"], 'value') else update_data["category"]
    if "status" in update_data:
        update_data["status"] = update_data["status"].value if hasattr(update_data["status"], 'value') else update_data["status"]
    
    result = supabase.table("events").update(update_data).eq("id", event_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    updated = result.data[0]
    return EventResponse(
        id=updated["id"],
        title=updated["title"],
        description=updated.get("description"),
        category=updated["category"],
        event_date=updated["event_date"],
        venue=updated["venue"],
        poster_url=updated.get("poster_url"),
        created_by=updated.get("created_by"),
        status=updated.get("status", "upcoming"),
        max_participants=updated.get("max_participants"),
        created_at=updated.get("created_at"),
        registration_count=0
    )


@router.delete("/{event_id}", response_model=MessageResponse)
async def delete_event(event_id: str, admin: dict = Depends(require_admin)):
    """
    Delete an event. Requires admin access.
    Also removes all associated registrations.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Delete associated registrations first
    supabase.table("event_registrations").delete().eq("event_id", event_id).execute()
    
    # Delete the event
    result = supabase.table("events").delete().eq("id", event_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return MessageResponse(message="Event deleted successfully")

"""
Club API Endpoints
CRUD operations for clubs with membership counts and announcements.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query

from database.supabase_client import supabase
from auth.google_oauth import get_current_user, require_admin
from models.schemas import (
    ClubCreate, ClubUpdate, ClubResponse,
    AnnouncementCreate, AnnouncementResponse,
    MessageResponse
)

router = APIRouter(prefix="/clubs", tags=["Clubs"])


# ============================================================
# Public Endpoints
# ============================================================

@router.get("", response_model=List[ClubResponse])
async def get_clubs(
    search: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0)
):
    """
    Get all clubs with optional search filtering.
    Returns clubs sorted by creation date.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = supabase.table("clubs").select("*")
    
    if search:
        query = query.ilike("name", f"%{search}%")
    
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    # Get member counts for each club
    clubs = []
    for club in result.data:
        member_count = supabase.table("club_memberships").select(
            "id", count="exact"
        ).eq("club_id", club["id"]).execute()
        
        clubs.append(ClubResponse(
            id=club["id"],
            name=club["name"],
            description=club.get("description"),
            logo_url=club.get("logo_url"),
            category=club.get("category"),
            created_by=club.get("created_by"),
            created_at=club.get("created_at"),
            member_count=member_count.count or 0
        ))
    
    return clubs


@router.get("/{club_id}", response_model=ClubResponse)
async def get_club(club_id: str):
    """
    Get a single club by ID with its member count.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("clubs").select("*").eq("id", club_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Club not found")
    
    club = result.data[0]
    
    member_count = supabase.table("club_memberships").select(
        "id", count="exact"
    ).eq("club_id", club_id).execute()
    
    return ClubResponse(
        id=club["id"],
        name=club["name"],
        description=club.get("description"),
        logo_url=club.get("logo_url"),
        category=club.get("category"),
        created_by=club.get("created_by"),
        created_at=club.get("created_at"),
        member_count=member_count.count or 0
    )


# ============================================================
# Announcement Endpoints
# ============================================================

@router.get("/{club_id}/announcements", response_model=List[AnnouncementResponse])
async def get_club_announcements(club_id: str):
    """
    Get all announcements for a specific club.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("club_announcements").select("*").eq(
        "club_id", club_id
    ).order("created_at", desc=True).execute()
    
    return [AnnouncementResponse(**ann) for ann in result.data]


@router.post("/{club_id}/announcements", response_model=AnnouncementResponse)
async def create_announcement(
    club_id: str,
    announcement: AnnouncementCreate,
    current_user: dict = Depends(require_admin)
):
    """
    Create a new announcement for a club. Requires admin access.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    ann_data = announcement.model_dump()
    ann_data["club_id"] = club_id
    ann_data["created_by"] = current_user["id"]
    
    result = supabase.table("club_announcements").insert(ann_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create announcement")
    
    return AnnouncementResponse(**result.data[0])


# ============================================================
# Members Endpoints
# ============================================================

@router.get("/{club_id}/members")
async def get_club_members(club_id: str):
    """
    Get all members of a specific club.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Get membership records with user info
    memberships = supabase.table("club_memberships").select("*").eq("club_id", club_id).execute()
    
    members = []
    for membership in memberships.data:
        user = supabase.table("users").select("id, name, email, avatar_url").eq(
            "id", membership["user_id"]
        ).execute()
        if user.data:
            members.append({
                "membership_id": membership["id"],
                "joined_at": membership["joined_at"],
                "user": user.data[0]
            })
    
    return members


# ============================================================
# Admin Endpoints
# ============================================================

@router.post("", response_model=ClubResponse)
async def create_club(club: ClubCreate, current_user: dict = Depends(require_admin)):
    """
    Create a new club. Requires admin access.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    club_data = club.model_dump()
    club_data["created_by"] = current_user["id"]
    
    result = supabase.table("clubs").insert(club_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create club")
    
    created = result.data[0]
    return ClubResponse(
        id=created["id"],
        name=created["name"],
        description=created.get("description"),
        logo_url=created.get("logo_url"),
        category=created.get("category"),
        created_by=created.get("created_by"),
        created_at=created.get("created_at"),
        member_count=0
    )


@router.put("/{club_id}", response_model=ClubResponse)
async def update_club(club_id: str, club: ClubUpdate, admin: dict = Depends(require_admin)):
    """
    Update an existing club. Requires admin access.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    update_data = {k: v for k, v in club.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = supabase.table("clubs").update(update_data).eq("id", club_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Club not found")
    
    updated = result.data[0]
    return ClubResponse(
        id=updated["id"],
        name=updated["name"],
        description=updated.get("description"),
        logo_url=updated.get("logo_url"),
        category=updated.get("category"),
        created_by=updated.get("created_by"),
        created_at=updated.get("created_at"),
        member_count=0
    )


@router.delete("/{club_id}", response_model=MessageResponse)
async def delete_club(club_id: str, admin: dict = Depends(require_admin)):
    """
    Delete a club. Requires admin access.
    Also removes all associated memberships and announcements.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Delete associated data first
    supabase.table("club_memberships").delete().eq("club_id", club_id).execute()
    supabase.table("club_announcements").delete().eq("club_id", club_id).execute()
    
    # Delete the club
    result = supabase.table("clubs").delete().eq("id", club_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Club not found")
    
    return MessageResponse(message="Club deleted successfully")

"""
Supabase Client Configuration
Initializes and exports the Supabase client for database operations.
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

# Supabase configuration
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

# Validate required environment variables
if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")


def get_supabase_client() -> Client:
    """
    Creates and returns a Supabase client instance.
    Uses service role key for full database access from the backend.
    """
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# Singleton client instance for reuse
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# 🎓 College Event & Club Hub (CampusHub)

A modern full-stack web application for managing college events, clubs, and student registrations. Features Google OAuth authentication, a premium glassmorphism UI, and full CRUD management.

---

## ✨ Features

- **Google OAuth Login** — Secure sign-in with Google accounts
- **Student Dashboard** — View registered events, joined clubs, and notifications
- **Admin Dashboard** — Full CRUD management for events, clubs, and users
- **Event Management** — Browse, filter, search, and register for events (Technical, Cultural, Sports)
- **Club Management** — Discover clubs, join/leave, view announcements and members
- **Responsive Design** — Mobile-first, works on all devices
- **Premium UI** — Dark theme with glassmorphism, animations, and modern typography

---

## 🛠 Tech Stack

| Layer        | Technology                 |
|-------------|---------------------------|
| Frontend    | HTML5, CSS3, JavaScript   |
| Backend     | Python (FastAPI)          |
| Database    | Supabase (PostgreSQL)     |
| Auth        | Google OAuth 2.0 + JWT    |
| Backend Deploy | Vercel               |
| Frontend Deploy | Netlify             |

---

## 📁 Project Structure

```
college-event-club-hub/
├── frontend/                   # Static frontend files
│   ├── index.html              # Landing page
│   ├── login.html              # Google login page
│   ├── dashboard.html          # Student dashboard
│   ├── admin.html              # Admin dashboard
│   ├── events.html             # Event listing
│   ├── event-detail.html       # Event detail + registration
│   ├── clubs.html              # Club listing
│   ├── club-detail.html        # Club detail + membership
│   ├── css/styles.css          # Design system (1000+ lines)
│   ├── js/
│   │   ├── api.js              # API client
│   │   ├── auth.js             # Google OAuth + session
│   │   ├── app.js              # Core utilities
│   │   ├── dashboard.js        # Student dashboard logic
│   │   ├── admin.js            # Admin dashboard logic
│   │   ├── events.js           # Events page logic
│   │   └── clubs.js            # Clubs page logic
│   └── assets/                 # Images and media
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── requirements.txt        # Python dependencies
│   ├── api/
│   │   ├── events.py           # Event CRUD endpoints
│   │   ├── clubs.py            # Club CRUD endpoints
│   │   └── registrations.py    # Registration endpoints
│   ├── auth/
│   │   └── google_oauth.py     # OAuth + JWT handler
│   ├── database/
│   │   ├── supabase_client.py  # Supabase connection
│   │   └── schema.sql          # Database schema
│   └── models/
│       └── schemas.py          # Pydantic models
├── vercel.json                 # Vercel config (backend)
├── netlify.toml                # Netlify config (frontend)
├── .env.example                # Environment variables template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+** installed
- **Node.js** (optional, for `npx` tools)
- **Supabase** account (free tier works)
- **Google Cloud Console** project with OAuth 2.0 credentials

### 1. Clone & Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd college-event-club-hub

# Copy environment template
cp .env.example .env
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `backend/database/schema.sql`
3. Copy your **Project URL** and **Service Role Key** from Settings → API
4. Paste into `.env`:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web application type)
3. Add authorized JavaScript origins: `http://localhost:5500`, `http://localhost:8000`
4. Add authorized redirect URIs as needed
5. Copy **Client ID** and **Client Secret** into `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
6. Also update `GOOGLE_CLIENT_ID` in `frontend/js/auth.js`

### 4. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 5. Run Backend Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with docs at `http://localhost:8000/docs`.

### 6. Run Frontend

Use any local server to serve the `frontend/` directory:

```bash
# Option 1: Python
cd frontend
python -m http.server 5500

# Option 2: VS Code Live Server extension
# Right-click index.html → Open with Live Server

# Option 3: npx
npx serve frontend -p 5500
```

Visit `http://localhost:5500` in your browser.

---

## 🧪 Demo Mode

The frontend includes **demo mode** that works without a backend or Google credentials:

- All pages show demo data (events, clubs, members) when the API is unavailable
- Click **Sign In** → the demo login creates a local session
- Useful for testing the UI without setting up Supabase/Google

---

## 🌐 Deployment

### Backend → Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. From the project root: `vercel`
3. Set environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `JWT_SECRET`

### Frontend → Netlify

1. Connect your Git repo to Netlify
2. Set **Publish directory** to `frontend`
3. Update `netlify.toml` — replace the API redirect URL with your Vercel backend URL
4. Deploy!

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google-login` | Login with Google token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| PUT | `/api/auth/make-admin/{id}` | Promote user (admin) |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (filter by category/status) |
| GET | `/api/events/{id}` | Get event detail |
| POST | `/api/events` | Create event (admin) |
| PUT | `/api/events/{id}` | Update event (admin) |
| DELETE | `/api/events/{id}` | Delete event (admin) |

### Clubs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clubs` | List clubs |
| GET | `/api/clubs/{id}` | Get club detail |
| POST | `/api/clubs` | Create club (admin) |
| PUT | `/api/clubs/{id}` | Update club (admin) |
| DELETE | `/api/clubs/{id}` | Delete club (admin) |
| GET | `/api/clubs/{id}/announcements` | Get announcements |
| POST | `/api/clubs/{id}/announcements` | Post announcement (admin) |
| GET | `/api/clubs/{id}/members` | Get members |

### Registrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/registrations/events/{id}` | Register for event |
| DELETE | `/api/registrations/events/{id}` | Unregister from event |
| GET | `/api/registrations/events/my` | My registrations |
| POST | `/api/registrations/clubs/{id}` | Join club |
| DELETE | `/api/registrations/clubs/{id}` | Leave club |
| GET | `/api/registrations/clubs/my` | My memberships |

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

Built with ❤️ by CampusHub Team

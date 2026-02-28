/**
 * Admin Dashboard Module
 * Handles: event CRUD, club CRUD, user management, and admin stats.
 */

// ============================================================
// Initialize Admin Dashboard
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initAdminDashboard();
});

/**
 * Initializes the admin dashboard — checks role and loads data.
 */
async function initAdminDashboard() {
    if (!isLoggedIn()) {
        showToast('Please sign in to access admin dashboard', 'info');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const user = getCurrentUser();
    if (user.role !== 'admin') {
        showToast('Admin access required. Use demo admin login for testing.', 'error');
        // Still allow viewing in demo mode
    }

    loadAdminStats();
    loadAdminEvents();
    loadAdminClubs();
    loadAdminUsers();
}

// ============================================================
// Stats
// ============================================================

async function loadAdminStats() {
    try {
        const [events, clubs, users] = await Promise.allSettled([
            api.getEvents(),
            api.getClubs(),
            api.getAllUsers(),
        ]);

        document.getElementById('adminStatEvents').textContent =
            events.status === 'fulfilled' ? events.value.length : '—';
        document.getElementById('adminStatClubs').textContent =
            clubs.status === 'fulfilled' ? clubs.value.length : '—';
        document.getElementById('adminStatUsers').textContent =
            users.status === 'fulfilled' ? users.value.length : '—';

        // Sum registration counts
        let totalRegs = 0;
        if (events.status === 'fulfilled') {
            totalRegs = events.value.reduce((sum, e) => sum + (e.registration_count || 0), 0);
        }
        document.getElementById('adminStatRegistrations').textContent = totalRegs;

    } catch (error) {
        console.warn('Admin stats: using fallback data');
        document.getElementById('adminStatEvents').textContent = '15';
        document.getElementById('adminStatClubs').textContent = '8';
        document.getElementById('adminStatUsers').textContent = '250';
        document.getElementById('adminStatRegistrations').textContent = '120';
    }
}

// ============================================================
// Events Management
// ============================================================

let allAdminEvents = [];

async function loadAdminEvents() {
    try {
        allAdminEvents = await api.getEvents();
        renderAdminEventsTable(allAdminEvents);
        renderRecentEventsTable(allAdminEvents.slice(0, 5));
    } catch (error) {
        console.warn('Could not load events');
        renderDemoAdminEvents();
    }
}

function renderAdminEventsTable(events) {
    const tbody = document.getElementById('adminEventsBody');
    if (!tbody) return;

    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:var(--space-xl);">No events yet. Create one!</td></tr>';
        return;
    }

    tbody.innerHTML = events.map(event => `
        <tr>
            <td><strong>${event.title}</strong></td>
            <td><span class="event-card-category ${getCategoryClass(event.category)}" style="display:inline-block;">${event.category}</span></td>
            <td>${formatDateShort(event.event_date)}</td>
            <td>${event.venue}</td>
            <td><span class="badge ${getStatusBadge(event.status)}">${event.status}</span></td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="editEvent('${event.id}')" style="margin-right:4px;">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteEvent('${event.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderRecentEventsTable(events) {
    const tbody = document.getElementById('adminRecentEventsBody');
    if (!tbody) return;

    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No events yet</td></tr>';
        return;
    }

    tbody.innerHTML = events.map(event => `
        <tr>
            <td><strong>${event.title}</strong></td>
            <td><span class="event-card-category ${getCategoryClass(event.category)}" style="display:inline-block;">${event.category}</span></td>
            <td>${formatDateShort(event.event_date)}</td>
            <td><span class="badge ${getStatusBadge(event.status)}">${event.status}</span></td>
            <td>${event.registration_count || 0}</td>
        </tr>
    `).join('');
}

function renderDemoAdminEvents() {
    const demoEvents = [
        { id: 'd1', title: 'Hackathon 2026', category: 'Technical', event_date: '2026-03-15', venue: 'Main Auditorium', status: 'upcoming', registration_count: 45 },
        { id: 'd2', title: 'Cultural Fest', category: 'Cultural', event_date: '2026-03-20', venue: 'Open Grounds', status: 'upcoming', registration_count: 120 },
        { id: 'd3', title: 'Cricket Tournament', category: 'Sports', event_date: '2026-04-05', venue: 'Sports Complex', status: 'upcoming', registration_count: 32 },
    ];
    renderAdminEventsTable(demoEvents);
    renderRecentEventsTable(demoEvents);
}

// ============================================================
// Event Modal
// ============================================================

function openEventModal(eventId = null) {
    const modal = document.getElementById('eventModal');
    const title = document.getElementById('eventModalTitle');
    const form = document.getElementById('eventForm');

    form.reset();
    document.getElementById('eventFormId').value = '';

    if (eventId) {
        title.textContent = 'Edit Event';
        const event = allAdminEvents.find(e => e.id === eventId);
        if (event) {
            document.getElementById('eventFormId').value = event.id;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventCategory').value = event.category;
            document.getElementById('eventDate').value = event.event_date ? event.event_date.slice(0, 16) : '';
            document.getElementById('eventVenue').value = event.venue;
            document.getElementById('eventPoster').value = event.poster_url || '';
            document.getElementById('eventMaxParticipants').value = event.max_participants || '';
            document.getElementById('eventStatus').value = event.status || 'upcoming';
        }
    } else {
        title.textContent = 'Add New Event';
    }

    modal.classList.add('active');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
}

async function handleEventSubmit(e) {
    e.preventDefault();

    const eventId = document.getElementById('eventFormId').value;
    const data = {
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        category: document.getElementById('eventCategory').value,
        event_date: document.getElementById('eventDate').value,
        venue: document.getElementById('eventVenue').value,
        poster_url: document.getElementById('eventPoster').value || null,
        max_participants: document.getElementById('eventMaxParticipants').value
            ? parseInt(document.getElementById('eventMaxParticipants').value) : null,
    };

    try {
        if (eventId) {
            data.status = document.getElementById('eventStatus').value;
            await api.updateEvent(eventId, data);
            showToast('Event updated successfully', 'success');
        } else {
            await api.createEvent(data);
            showToast('Event created successfully', 'success');
        }
        closeEventModal();
        loadAdminEvents();
        loadAdminStats();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

function editEvent(eventId) {
    openEventModal(eventId);
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
        await api.deleteEvent(eventId);
        showToast('Event deleted', 'success');
        loadAdminEvents();
        loadAdminStats();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ============================================================
// Clubs Management
// ============================================================

let allAdminClubs = [];

async function loadAdminClubs() {
    try {
        allAdminClubs = await api.getClubs();
        renderAdminClubsTable(allAdminClubs);
    } catch (error) {
        console.warn('Could not load clubs');
        renderDemoAdminClubs();
    }
}

function renderAdminClubsTable(clubs) {
    const tbody = document.getElementById('adminClubsBody');
    if (!tbody) return;

    if (clubs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:var(--space-xl);">No clubs yet. Create one!</td></tr>';
        return;
    }

    tbody.innerHTML = clubs.map(club => `
        <tr>
            <td><strong>${club.name}</strong></td>
            <td>${club.category || '—'}</td>
            <td>${club.member_count || 0}</td>
            <td>${formatDateShort(club.created_at)}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="editClub('${club.id}')" style="margin-right:4px;">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteClub('${club.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderDemoAdminClubs() {
    const demoClubs = [
        { id: 'c1', name: 'Robotics Club', category: 'Technology', member_count: 120, created_at: '2025-08-01' },
        { id: 'c2', name: 'Music Society', category: 'Arts', member_count: 85, created_at: '2025-07-15' },
        { id: 'c3', name: 'Chess Club', category: 'Strategy', member_count: 60, created_at: '2025-09-01' },
    ];
    renderAdminClubsTable(demoClubs);
}

// ============================================================
// Club Modal
// ============================================================

function openClubModal(clubId = null) {
    const modal = document.getElementById('clubModal');
    const title = document.getElementById('clubModalTitle');
    const form = document.getElementById('clubForm');

    form.reset();
    document.getElementById('clubFormId').value = '';

    if (clubId) {
        title.textContent = 'Edit Club';
        const club = allAdminClubs.find(c => c.id === clubId);
        if (club) {
            document.getElementById('clubFormId').value = club.id;
            document.getElementById('clubName').value = club.name;
            document.getElementById('clubDescription').value = club.description || '';
            document.getElementById('clubCategory').value = club.category || '';
            document.getElementById('clubLogo').value = club.logo_url || '';
        }
    } else {
        title.textContent = 'Add New Club';
    }

    modal.classList.add('active');
}

function closeClubModal() {
    document.getElementById('clubModal').classList.remove('active');
}

async function handleClubSubmit(e) {
    e.preventDefault();

    const clubId = document.getElementById('clubFormId').value;
    const data = {
        name: document.getElementById('clubName').value,
        description: document.getElementById('clubDescription').value,
        category: document.getElementById('clubCategory').value || null,
        logo_url: document.getElementById('clubLogo').value || null,
    };

    try {
        if (clubId) {
            await api.updateClub(clubId, data);
            showToast('Club updated successfully', 'success');
        } else {
            await api.createClub(data);
            showToast('Club created successfully', 'success');
        }
        closeClubModal();
        loadAdminClubs();
        loadAdminStats();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

function editClub(clubId) {
    openClubModal(clubId);
}

async function deleteClub(clubId) {
    if (!confirm('Are you sure you want to delete this club?')) return;

    try {
        await api.deleteClub(clubId);
        showToast('Club deleted', 'success');
        loadAdminClubs();
        loadAdminStats();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ============================================================
// Users Management
// ============================================================

async function loadAdminUsers() {
    try {
        const users = await api.getAllUsers();
        renderAdminUsersTable(users);
    } catch (error) {
        console.warn('Could not load users');
        renderDemoAdminUsers();
    }
}

function renderAdminUsersTable(users) {
    const tbody = document.getElementById('adminUsersBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No users yet</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="user-cell">
                    <img src="${user.avatar_url || generateAvatar(user.name)}" alt="${user.name}">
                    <span>${user.name}</span>
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-warning' : 'badge-info'}">${user.role}</span></td>
            <td>${formatDateShort(user.created_at)}</td>
            <td>
                ${user.role !== 'admin'
            ? `<button class="btn btn-outline btn-sm" onclick="promoteUser('${user.id}')">Make Admin</button>`
            : '<span class="text-muted">Admin</span>'}
            </td>
        </tr>
    `).join('');
}

function renderDemoAdminUsers() {
    const demoUsers = [
        { id: 'u1', name: 'Alice Johnson', email: 'alice@college.edu', role: 'student', avatar_url: '', created_at: '2025-10-01' },
        { id: 'u2', name: 'Bob Smith', email: 'bob@college.edu', role: 'admin', avatar_url: '', created_at: '2025-09-15' },
        { id: 'u3', name: 'Charlie Brown', email: 'charlie@college.edu', role: 'student', avatar_url: '', created_at: '2025-11-01' },
    ];
    renderAdminUsersTable(demoUsers);
}

async function promoteUser(userId) {
    if (!confirm('Promote this user to admin?')) return;

    try {
        await api.makeAdmin(userId);
        showToast('User promoted to admin', 'success');
        loadAdminUsers();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

/**
 * Dashboard Module
 * Handles the student dashboard — loads user data, events, clubs, and notifications.
 */

// ============================================================
// Initialize Dashboard
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

/**
 * Initializes the student dashboard with user data.
 */
async function initDashboard() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        showToast('Please sign in to access your dashboard', 'info');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const user = getCurrentUser();

    // Set username in header
    const dashUserName = document.getElementById('dashUserName');
    if (dashUserName) dashUserName.textContent = user.name.split(' ')[0];

    // Load dashboard data
    loadDashboardStats();
    loadMyEvents();
    loadMyClubs();
}

// ============================================================
// Load Stats
// ============================================================

/**
 * Loads overview statistics for the dashboard cards.
 */
async function loadDashboardStats() {
    try {
        // Try loading from API
        const [events, registrations, memberships] = await Promise.allSettled([
            api.getEvents({ status: 'upcoming' }),
            api.getMyEventRegistrations(),
            api.getMyClubMemberships(),
        ]);

        const upcomingCount = events.status === 'fulfilled' ? events.value.length : 0;
        const regCount = registrations.status === 'fulfilled' ? registrations.value.length : 0;
        const clubCount = memberships.status === 'fulfilled' ? memberships.value.length : 0;

        document.getElementById('statUpcoming').textContent = upcomingCount;
        document.getElementById('statRegistered').textContent = regCount;
        document.getElementById('statClubs').textContent = clubCount;
        document.getElementById('statNotifications').textContent = '0';

    } catch (error) {
        // Fallback demo stats
        console.warn('Could not load stats from API, using demo data');
        document.getElementById('statUpcoming').textContent = '12';
        document.getElementById('statRegistered').textContent = '3';
        document.getElementById('statClubs').textContent = '2';
        document.getElementById('statNotifications').textContent = '5';
    }
}

// ============================================================
// Load My Events
// ============================================================

/**
 * Loads the user's registered events into the dashboard.
 */
async function loadMyEvents() {
    const container = document.getElementById('dashUpcomingEvents');
    const listContainer = document.getElementById('myEventsList');

    try {
        const registrations = await api.getMyEventRegistrations();

        if (registrations.length === 0) {
            if (container) container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <span class="empty-icon">📅</span>
                    <h3>No registered events</h3>
                    <p>Browse events and register to see them here.</p>
                    <a href="events.html" class="btn btn-primary" style="margin-top:var(--space-md);">Browse Events</a>
                </div>
            `;
            if (listContainer) listContainer.innerHTML = container.innerHTML;
            return;
        }

        // Render event cards
        const cardsHtml = registrations.map(reg => {
            const event = reg.event;
            if (!event) return '';
            return createEventCardHtml(event);
        }).join('');

        if (container) container.innerHTML = cardsHtml;
        if (listContainer) listContainer.innerHTML = `<div class="card-grid">${cardsHtml}</div>`;

    } catch (error) {
        console.warn('Could not load events from API, showing demo content');
        renderDemoEvents(container, listContainer);
    }
}

/**
 * Renders demo event cards for when the API is not available.
 */
function renderDemoEvents(container, listContainer) {
    const demoHtml = `
        <div class="event-card" onclick="window.location.href='event-detail.html?id=demo1'">
            <div class="event-card-image" style="background:linear-gradient(135deg,#6366f1,#3d54a8);display:flex;align-items:center;justify-content:center;font-size:3rem;">💻</div>
            <div class="event-card-body">
                <span class="event-card-category technical">Technical</span>
                <h3>Web Development Workshop</h3>
                <p>Learn modern web development with hands-on projects.</p>
                <div class="event-card-meta">
                    <span>📅 Mar 10, 2026</span>
                    <span>📍 Lab 201</span>
                </div>
            </div>
        </div>
        <div class="event-card" onclick="window.location.href='event-detail.html?id=demo2'">
            <div class="event-card-image" style="background:linear-gradient(135deg,#ec4899,#a855f7);display:flex;align-items:center;justify-content:center;font-size:3rem;">🎭</div>
            <div class="event-card-body">
                <span class="event-card-category cultural">Cultural</span>
                <h3>Talent Show</h3>
                <p>Showcase your talents — singing, dance, comedy, and more!</p>
                <div class="event-card-meta">
                    <span>📅 Mar 18, 2026</span>
                    <span>📍 Auditorium</span>
                </div>
            </div>
        </div>
    `;
    if (container) container.innerHTML = demoHtml;
    if (listContainer) listContainer.innerHTML = `<div class="card-grid">${demoHtml}</div>`;
}

// ============================================================
// Load My Clubs
// ============================================================

/**
 * Loads the user's joined clubs into the dashboard.
 */
async function loadMyClubs() {
    const container = document.getElementById('dashClubs');
    const listContainer = document.getElementById('myClubsList');

    try {
        const memberships = await api.getMyClubMemberships();

        if (memberships.length === 0) {
            const emptyHtml = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <span class="empty-icon">👥</span>
                    <h3>No clubs joined</h3>
                    <p>Explore clubs and join to see them here.</p>
                    <a href="clubs.html" class="btn btn-primary" style="margin-top:var(--space-md);">Browse Clubs</a>
                </div>
            `;
            if (container) container.innerHTML = emptyHtml;
            if (listContainer) listContainer.innerHTML = emptyHtml;
            return;
        }

        const cardsHtml = memberships.map(mem => {
            const club = mem.club;
            if (!club) return '';
            return createClubCardHtml(club);
        }).join('');

        if (container) container.innerHTML = cardsHtml;
        if (listContainer) listContainer.innerHTML = `<div class="card-grid-3">${cardsHtml}</div>`;

    } catch (error) {
        console.warn('Could not load clubs from API, showing demo content');
        renderDemoClubs(container, listContainer);
    }
}

/**
 * Renders demo club cards when API is unavailable.
 */
function renderDemoClubs(container, listContainer) {
    const demoHtml = `
        <div class="club-card" onclick="window.location.href='club-detail.html?id=demo1'">
            <div class="club-card-logo">🤖</div>
            <h3>Robotics Club</h3>
            <p>Build robots and compete in national contests.</p>
            <div class="club-card-members">👥 120 Members</div>
        </div>
        <div class="club-card" onclick="window.location.href='club-detail.html?id=demo2'">
            <div class="club-card-logo">💡</div>
            <h3>Innovation Lab</h3>
            <p>Turn your ideas into reality with our maker space.</p>
            <div class="club-card-members">👥 85 Members</div>
        </div>
    `;
    if (container) container.innerHTML = demoHtml;
    if (listContainer) listContainer.innerHTML = `<div class="card-grid-3">${demoHtml}</div>`;
}

// ============================================================
// Card HTML Generators
// ============================================================

/**
 * Creates HTML for an event card with click navigation.
 * @param {object} event - Event data
 * @returns {string} HTML string
 */
function createEventCardHtml(event) {
    const catClass = getCategoryClass(event.category);
    const catIcon = getCategoryIcon(event.category);
    const bgGradients = {
        'Technical': 'linear-gradient(135deg,#6366f1,#3d54a8)',
        'Cultural': 'linear-gradient(135deg,#ec4899,#a855f7)',
        'Sports': 'linear-gradient(135deg,#10b981,#059669)',
    };
    const bg = bgGradients[event.category] || bgGradients['Technical'];

    return `
        <div class="event-card" onclick="window.location.href='event-detail.html?id=${event.id}'">
            ${event.poster_url
            ? `<img class="event-card-image" src="${event.poster_url}" alt="${event.title}">`
            : `<div class="event-card-image" style="background:${bg};display:flex;align-items:center;justify-content:center;font-size:3rem;">${catIcon}</div>`
        }
            <div class="event-card-body">
                <span class="event-card-category ${catClass}">${event.category}</span>
                <h3>${event.title}</h3>
                <p>${event.description || ''}</p>
                <div class="event-card-meta">
                    <span>📅 ${formatDateShort(event.event_date)}</span>
                    <span>📍 ${event.venue}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Creates HTML for a club card with click navigation.
 * @param {object} club - Club data
 * @returns {string} HTML string
 */
function createClubCardHtml(club) {
    const icons = ['🤖', '🎵', '📸', '💡', '🎨', '♟️', '🏀', '📚', '🔬', '🎮'];
    const icon = icons[club.name.length % icons.length];

    return `
        <div class="club-card" onclick="window.location.href='club-detail.html?id=${club.id}'">
            ${club.logo_url
            ? `<img class="club-card-logo" src="${club.logo_url}" alt="${club.name}" style="border-radius:var(--radius-md);">`
            : `<div class="club-card-logo">${icon}</div>`
        }
            <h3>${club.name}</h3>
            <p>${club.description || ''}</p>
            <div class="club-card-members">👥 ${club.member_count || 0} Members</div>
        </div>
    `;
}

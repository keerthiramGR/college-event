/**
 * Events Module
 * Handles event listing, filtering, search, and event detail pages.
 */

// ============================================================
// State
// ============================================================

let allEvents = [];
let currentFilter = 'all';

// ============================================================
// Initialize
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we're on
    if (document.getElementById('eventsGrid')) {
        initEventsPage();
    } else if (document.getElementById('eventDetailTitle')) {
        initEventDetailPage();
    }
});

// ============================================================
// Events Listing Page
// ============================================================

/**
 * Initializes the events listing page — loads events and applies URL filters.
 */
async function initEventsPage() {
    // Check for URL category filter
    const urlCategory = getQueryParam('category');
    if (urlCategory) {
        currentFilter = urlCategory;
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.includes(urlCategory) ||
                (urlCategory === 'all' && btn.textContent === 'All')) {
                btn.classList.add('active');
            }
        });
    }

    await loadEvents();
}

/**
 * Loads events from the API with fallback demo data.
 */
async function loadEvents() {
    const grid = document.getElementById('eventsGrid');
    const emptyState = document.getElementById('eventsEmptyState');

    try {
        const params = {};
        if (currentFilter && currentFilter !== 'all') {
            params.category = currentFilter;
        }

        const searchInput = document.getElementById('eventSearchInput');
        if (searchInput && searchInput.value) {
            params.search = searchInput.value;
        }

        allEvents = await api.getEvents(params);
        renderEvents(allEvents);

    } catch (error) {
        console.warn('Could not load events from API, showing demo events');
        loadDemoEvents();
    }
}

/**
 * Renders event cards into the grid.
 * @param {Array} events - Array of event objects
 */
function renderEvents(events) {
    const grid = document.getElementById('eventsGrid');
    const emptyState = document.getElementById('eventsEmptyState');

    if (!grid) return;

    if (events.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    grid.innerHTML = events.map((event, index) => {
        const catClass = getCategoryClass(event.category);
        const catIcon = getCategoryIcon(event.category);
        const bgGradients = {
            'Technical': 'linear-gradient(135deg,#6366f1,#3d54a8)',
            'Cultural': 'linear-gradient(135deg,#ec4899,#a855f7)',
            'Sports': 'linear-gradient(135deg,#10b981,#059669)',
        };
        const bg = bgGradients[event.category] || bgGradients['Technical'];
        const delay = Math.min(index, 5);

        return `
            <div class="event-card animate-fade-in-up stagger-${delay + 1}" 
                 onclick="window.location.href='event-detail.html?id=${event.id}'">
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
                        <span>👥 ${event.registration_count || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Loads demo events for display when the API is not available.
 */
function loadDemoEvents() {
    allEvents = [
        { id: 'demo1', title: 'Hackathon 2026', description: 'Build innovative solutions in 24 hours. Open to all departments.', category: 'Technical', event_date: '2026-03-15T09:00:00', venue: 'Main Auditorium', status: 'upcoming', registration_count: 45 },
        { id: 'demo2', title: 'Annual Cultural Fest', description: 'A vibrant celebration of art, music, dance, and creativity.', category: 'Cultural', event_date: '2026-03-20T10:00:00', venue: 'Open Grounds', status: 'upcoming', registration_count: 120 },
        { id: 'demo3', title: 'Inter-College Cricket', description: 'Compete against top college teams. Registrations open now!', category: 'Sports', event_date: '2026-04-05T08:00:00', venue: 'Sports Complex', status: 'upcoming', registration_count: 32 },
        { id: 'demo4', title: 'AI/ML Workshop', description: 'Introduction to machine learning with hands-on exercises.', category: 'Technical', event_date: '2026-03-25T14:00:00', venue: 'CS Lab 301', status: 'upcoming', registration_count: 28 },
        { id: 'demo5', title: 'Dance Competition', description: 'Solo and group dance performances. All genres welcome!', category: 'Cultural', event_date: '2026-04-10T17:00:00', venue: 'Main Hall', status: 'upcoming', registration_count: 55 },
        { id: 'demo6', title: 'Basketball League', description: 'Inter-department basketball tournament series.', category: 'Sports', event_date: '2026-04-15T16:00:00', venue: 'Indoor Court', status: 'upcoming', registration_count: 40 },
        { id: 'demo7', title: 'Web Dev Bootcamp', description: 'Full-stack web development intensive course – React, Node, and more.', category: 'Technical', event_date: '2026-03-28T09:00:00', venue: 'Lab 201', status: 'upcoming', registration_count: 35 },
        { id: 'demo8', title: 'Photography Walk', description: 'Explore campus through lenses — photo walk and editing session.', category: 'Cultural', event_date: '2026-04-02T06:00:00', venue: 'Campus Grounds', status: 'upcoming', registration_count: 18 },
        { id: 'demo9', title: 'Table Tennis Open', description: 'Open table tennis championship — singles and doubles.', category: 'Sports', event_date: '2026-04-08T10:00:00', venue: 'Recreation Hall', status: 'upcoming', registration_count: 24 },
    ];

    // Apply filter
    let filtered = allEvents;
    if (currentFilter && currentFilter !== 'all') {
        filtered = allEvents.filter(e => e.category === currentFilter);
    }

    renderEvents(filtered);
}

// ============================================================
// Filter & Search
// ============================================================

/**
 * Sets the category filter and re-renders events.
 * @param {string}      category - Category filter ('all', 'Technical', etc.)
 * @param {HTMLElement}  btn      - The clicked filter button
 */
function setEventFilter(category, btn) {
    currentFilter = category;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Re-filter
    filterEvents();
}

/**
 * Filters events based on active category and search input.
 */
function filterEvents() {
    const searchValue = document.getElementById('eventSearchInput')?.value.toLowerCase() || '';

    let filtered = allEvents;

    // Category filter
    if (currentFilter && currentFilter !== 'all') {
        filtered = filtered.filter(e => e.category === currentFilter);
    }

    // Search filter
    if (searchValue) {
        filtered = filtered.filter(e =>
            e.title.toLowerCase().includes(searchValue) ||
            (e.description && e.description.toLowerCase().includes(searchValue)) ||
            e.venue.toLowerCase().includes(searchValue)
        );
    }

    renderEvents(filtered);
}

// ============================================================
// Event Detail Page
// ============================================================

let currentEventId = null;
let isRegistered = false;

/**
 * Initializes the event detail page.
 */
async function initEventDetailPage() {
    currentEventId = getQueryParam('id');
    if (!currentEventId) {
        showToast('No event specified', 'error');
        return;
    }

    await loadEventDetail(currentEventId);
}

/**
 * Loads event detail and populates the page.
 * @param {string} eventId
 */
async function loadEventDetail(eventId) {
    try {
        const event = await api.getEvent(eventId);
        renderEventDetail(event);

        // Check if user is registered for this event
        if (isLoggedIn()) {
            checkEventRegistration(eventId);
        }
    } catch (error) {
        console.warn('Could not load event, showing demo');
        renderDemoEventDetail();
    }
}

/**
 * Renders event detail information into the page.
 * @param {object} event
 */
function renderEventDetail(event) {
    const catClass = getCategoryClass(event.category);
    const catIcon = getCategoryIcon(event.category);
    const bgGradients = {
        'Technical': 'linear-gradient(135deg,#6366f1,#3d54a8)',
        'Cultural': 'linear-gradient(135deg,#ec4899,#a855f7)',
        'Sports': 'linear-gradient(135deg,#10b981,#059669)',
    };
    const bg = bgGradients[event.category] || bgGradients['Technical'];

    // Image
    const imageEl = document.getElementById('eventDetailImage');
    if (imageEl) {
        if (event.poster_url) {
            imageEl.outerHTML = `<img class="event-card-image event-detail-image" src="${event.poster_url}" alt="${event.title}" id="eventDetailImage">`;
        } else {
            imageEl.style.background = bg;
            imageEl.innerHTML = `<span style="font-size:5rem;">${catIcon}</span>`;
        }
    }

    // Category
    const catEl = document.getElementById('eventDetailCategory');
    if (catEl) {
        catEl.className = `event-card-category ${catClass}`;
        catEl.textContent = event.category;
    }

    // Title, description
    document.getElementById('eventDetailTitle').textContent = event.title;
    document.getElementById('eventDetailDescription').innerHTML = event.description || 'No description available.';

    // Meta
    document.getElementById('eventDetailDate').textContent = formatDate(event.event_date);
    document.getElementById('eventDetailVenue').textContent = event.venue;
    document.getElementById('eventDetailRegCount').textContent = `${event.registration_count || 0} registered`;

    const statusEl = document.getElementById('eventDetailStatus');
    statusEl.textContent = event.status;
    statusEl.className = `badge ${getStatusBadge(event.status)}`;

    // Update page title
    document.title = `${event.title} — CampusHub`;
}

/**
 * Renders demo event detail for when API is unavailable.
 */
function renderDemoEventDetail() {
    const demo = {
        title: 'Hackathon 2026',
        description: '<p>Join us for an exciting 24-hour hackathon where teams compete to build innovative tech solutions!</p><p>This event is open to all departments and skill levels. Form teams of 2-4 members and tackle real-world challenges. Prizes worth ₹50,000 await the winners!</p><h3>What to Expect</h3><ul><li>24-hour coding marathon</li><li>Mentoring sessions from industry experts</li><li>Free meals and refreshments</li><li>Networking opportunities</li><li>Exciting prizes and swag</li></ul>',
        category: 'Technical',
        event_date: '2026-03-15T09:00:00',
        venue: 'Main Auditorium',
        status: 'upcoming',
        registration_count: 45,
    };
    renderEventDetail(demo);
}

/**
 * Checks if the current user is registered for the event.
 * @param {string} eventId
 */
async function checkEventRegistration(eventId) {
    try {
        const registrations = await api.getMyEventRegistrations();
        isRegistered = registrations.some(r => r.event_id === eventId);
        updateRegisterButton();
    } catch (error) {
        // Unable to check, leave as not registered
    }
}

/**
 * Updates the register button text and style based on registration status.
 */
function updateRegisterButton() {
    const btn = document.getElementById('eventRegisterBtn');
    const note = document.getElementById('eventRegisterNote');

    if (!btn) return;

    if (!isLoggedIn()) {
        btn.textContent = 'Sign In to Register';
        btn.onclick = () => window.location.href = 'login.html';
        if (note) note.textContent = 'You need to sign in first';
        return;
    }

    if (isRegistered) {
        btn.textContent = '✓ Registered — Click to Cancel';
        btn.className = 'btn btn-outline btn-lg';
        btn.style.width = '100%';
        btn.style.marginTop = 'var(--space-xl)';
        if (note) note.textContent = 'You are registered for this event';
    } else {
        btn.textContent = 'Register Now';
        btn.className = 'btn btn-accent btn-lg';
        btn.style.width = '100%';
        btn.style.marginTop = 'var(--space-xl)';
        if (note) note.textContent = '';
    }
}

/**
 * Toggles event registration (register/unregister).
 */
async function toggleEventRegistration() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    if (!currentEventId) return;

    try {
        if (isRegistered) {
            await api.unregisterFromEvent(currentEventId);
            isRegistered = false;
            showToast('Unregistered from event', 'info');
        } else {
            await api.registerForEvent(currentEventId);
            isRegistered = true;
            showToast('Successfully registered!', 'success');
        }
        updateRegisterButton();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

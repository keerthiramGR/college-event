/**
 * Clubs Module
 * Handles club listing, search, club detail page, and membership management.
 */

// ============================================================
// State
// ============================================================

let allClubs = [];

// ============================================================
// Initialize
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('clubsGrid')) {
        initClubsPage();
    } else if (document.getElementById('clubDetailName')) {
        initClubDetailPage();
    }
});

// ============================================================
// Clubs Listing Page
// ============================================================

/**
 * Initializes the clubs listing page — loads all clubs.
 */
async function initClubsPage() {
    await loadClubs();
}

/**
 * Loads clubs from API with demo fallback.
 */
async function loadClubs() {
    const grid = document.getElementById('clubsGrid');

    try {
        allClubs = await api.getClubs();
        renderClubs(allClubs);
    } catch (error) {
        console.warn('Could not load clubs from API, showing demo clubs');
        loadDemoClubs();
    }
}

/**
 * Renders club cards into the grid.
 * @param {Array} clubs
 */
function renderClubs(clubs) {
    const grid = document.getElementById('clubsGrid');
    const emptyState = document.getElementById('clubsEmptyState');

    if (!grid) return;

    if (clubs.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const icons = ['🤖', '🎵', '📸', '💡', '🎨', '♟️', '🏀', '📚', '🔬', '🎮', '🎭', '🏊'];

    grid.innerHTML = clubs.map((club, index) => {
        const icon = icons[club.name.length % icons.length];
        const delay = Math.min(index, 5);

        return `
            <div class="club-card animate-fade-in-up stagger-${delay + 1}" 
                 onclick="window.location.href='club-detail.html?id=${club.id}'">
                ${club.logo_url
                ? `<img class="club-card-logo" src="${club.logo_url}" alt="${club.name}" style="border-radius:var(--radius-md);">`
                : `<div class="club-card-logo">${icon}</div>`
            }
                <h3>${club.name}</h3>
                <p>${club.description || ''}</p>
                <div class="club-card-members">👥 ${club.member_count || 0} Members</div>
            </div>
        `;
    }).join('');
}

/**
 * Loads demo clubs when API is unavailable.
 */
function loadDemoClubs() {
    allClubs = [
        { id: 'dc1', name: 'Robotics Club', description: 'Build robots, compete in contests, and explore the future of automation.', logo_url: '', category: 'Technology', member_count: 120 },
        { id: 'dc2', name: 'Music Society', description: 'From classical to rock — jam sessions, concerts, and music workshops.', logo_url: '', category: 'Arts', member_count: 85 },
        { id: 'dc3', name: 'Photography Club', description: 'Capture moments, learn editing, and participate in photo walks.', logo_url: '', category: 'Arts', member_count: 95 },
        { id: 'dc4', name: 'Entrepreneurship Cell', description: 'Pitch ideas, attend startup talks, and build your venture.', logo_url: '', category: 'Business', member_count: 150 },
        { id: 'dc5', name: 'Art & Design Club', description: 'Sketching, digital art, UI/UX design, and creative workshops.', logo_url: '', category: 'Arts', member_count: 70 },
        { id: 'dc6', name: 'Chess Club', description: 'Strategy meets competition. Weekly matches and tournament prep.', logo_url: '', category: 'Strategy', member_count: 60 },
        { id: 'dc7', name: 'Coding Club', description: 'Competitive programming, coding contests, and algorithm workshops.', logo_url: '', category: 'Technology', member_count: 200 },
        { id: 'dc8', name: 'Debate Society', description: 'Sharpen your oratory. Model UN, parliamentary debates, and more.', logo_url: '', category: 'Literary', member_count: 45 },
        { id: 'dc9', name: 'Sports Committee', description: 'Organizing inter-department and inter-college sports events.', logo_url: '', category: 'Sports', member_count: 110 },
    ];
    renderClubs(allClubs);
}

// ============================================================
// Search / Filter
// ============================================================

/**
 * Filters clubs based on search input.
 */
function filterClubs() {
    const searchValue = document.getElementById('clubSearchInput')?.value.toLowerCase() || '';

    if (!searchValue) {
        renderClubs(allClubs);
        return;
    }

    const filtered = allClubs.filter(c =>
        c.name.toLowerCase().includes(searchValue) ||
        (c.description && c.description.toLowerCase().includes(searchValue)) ||
        (c.category && c.category.toLowerCase().includes(searchValue))
    );

    renderClubs(filtered);
}

// ============================================================
// Club Detail Page
// ============================================================

let currentClubId = null;
let isMember = false;

/**
 * Initializes the club detail page.
 */
async function initClubDetailPage() {
    currentClubId = getQueryParam('id');
    if (!currentClubId) {
        showToast('No club specified', 'error');
        return;
    }

    await loadClubDetail(currentClubId);
}

/**
 * Loads club details and populates the page.
 * @param {string} clubId
 */
async function loadClubDetail(clubId) {
    try {
        const club = await api.getClub(clubId);
        renderClubDetail(club);

        // Load announcements and members
        loadClubAnnouncements(clubId);
        loadClubMembersList(clubId);

        // Check membership
        if (isLoggedIn()) {
            checkClubMembership(clubId);
        }
    } catch (error) {
        console.warn('Could not load club, showing demo');
        renderDemoClubDetail();
    }
}

/**
 * Renders club detail information.
 * @param {object} club
 */
function renderClubDetail(club) {
    const icons = ['🤖', '🎵', '📸', '💡', '🎨', '♟️', '🏀', '📚', '🔬', '🎮'];
    const icon = icons[club.name.length % icons.length];

    const logoEl = document.getElementById('clubDetailLogo');
    if (logoEl) {
        if (club.logo_url) {
            logoEl.outerHTML = `<img class="club-card-logo" id="clubDetailLogo" src="${club.logo_url}" alt="${club.name}" style="width:100px;height:100px;border-radius:var(--radius-md);flex-shrink:0;">`;
        } else {
            logoEl.innerHTML = icon;
        }
    }

    document.getElementById('clubDetailName').textContent = club.name;
    document.getElementById('clubDetailDescription').textContent = club.description || 'No description available.';
    document.getElementById('clubDetailMembers').textContent = `👥 ${club.member_count || 0} Members`;

    const catEl = document.getElementById('clubDetailCategory');
    if (catEl) catEl.textContent = club.category || 'General';

    document.title = `${club.name} — CampusHub`;
}

/**
 * Renders demo club detail.
 */
function renderDemoClubDetail() {
    renderClubDetail({
        name: 'Robotics Club',
        description: 'Build robots, compete in national contests, and explore the cutting edge of automation and AI. Our club offers hands-on projects, workshops, and mentoring from industry professionals.',
        logo_url: '',
        category: 'Technology',
        member_count: 120,
    });

    // Demo announcements
    document.getElementById('clubAnnouncementsList').innerHTML = `
        <div class="announcement-card">
            <h4>Robotics Competition 2026</h4>
            <p>Registrations are now open for the National Robotics Competition. Team size: 3-5 members. Deadline: March 1, 2026.</p>
            <div class="ann-date">Feb 15, 2026</div>
        </div>
        <div class="announcement-card">
            <h4>Weekly Workshop Schedule</h4>
            <p>Our new workshop schedule is out! Sessions on Arduino, Raspberry Pi, and 3D printing every Saturday at 2 PM.</p>
            <div class="ann-date">Feb 10, 2026</div>
        </div>
    `;

    // Demo members
    document.getElementById('clubMembersList').innerHTML = `
        <div class="card-grid-3">
            <div class="glass-card-static" style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-md);">
                <img src="${generateAvatar('Alice Johnson')}" style="width:40px;height:40px;border-radius:50%;">
                <div>
                    <strong style="color:var(--neutral-100);">Alice Johnson</strong>
                    <p style="font-size:0.8rem;color:var(--neutral-400);">Joined Jan 2026</p>
                </div>
            </div>
            <div class="glass-card-static" style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-md);">
                <img src="${generateAvatar('Bob Smith')}" style="width:40px;height:40px;border-radius:50%;">
                <div>
                    <strong style="color:var(--neutral-100);">Bob Smith</strong>
                    <p style="font-size:0.8rem;color:var(--neutral-400);">Joined Dec 2025</p>
                </div>
            </div>
            <div class="glass-card-static" style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-md);">
                <img src="${generateAvatar('Charlie Brown')}" style="width:40px;height:40px;border-radius:50%;">
                <div>
                    <strong style="color:var(--neutral-100);">Charlie Brown</strong>
                    <p style="font-size:0.8rem;color:var(--neutral-400);">Joined Nov 2025</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// Announcements
// ============================================================

/**
 * Loads announcements for a club.
 * @param {string} clubId
 */
async function loadClubAnnouncements(clubId) {
    const container = document.getElementById('clubAnnouncementsList');
    if (!container) return;

    try {
        const announcements = await api.getClubAnnouncements(clubId);

        if (announcements.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📢</span>
                    <h3>No announcements yet</h3>
                    <p>Check back later for updates from this club.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = announcements.map(ann => `
            <div class="announcement-card">
                <h4>${ann.title}</h4>
                <p>${ann.content}</p>
                <div class="ann-date">${formatDateShort(ann.created_at)}</div>
            </div>
        `).join('');

    } catch (error) {
        // Keep existing content if API fails
    }
}

// ============================================================
// Members List
// ============================================================

/**
 * Loads members list for a club.
 * @param {string} clubId
 */
async function loadClubMembersList(clubId) {
    const container = document.getElementById('clubMembersList');
    if (!container) return;

    try {
        const members = await api.getClubMembers(clubId);

        if (members.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">👥</span>
                    <h3>No members yet</h3>
                    <p>Be the first to join this club!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="card-grid-3">
                ${members.map(m => `
                    <div class="glass-card-static" style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-md);">
                        <img src="${m.user.avatar_url || generateAvatar(m.user.name)}" 
                             style="width:40px;height:40px;border-radius:50%;" alt="${m.user.name}">
                        <div>
                            <strong style="color:var(--neutral-100);">${m.user.name}</strong>
                            <p style="font-size:0.8rem;color:var(--neutral-400);">Joined ${formatDateShort(m.joined_at)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        // Keep existing content
    }
}

// ============================================================
// Membership Management
// ============================================================

/**
 * Checks if the current user is a member of the club.
 * @param {string} clubId
 */
async function checkClubMembership(clubId) {
    try {
        const memberships = await api.getMyClubMemberships();
        isMember = memberships.some(m => m.club_id === clubId);
        updateJoinButton();
    } catch (error) {
        // Unable to check
    }
}

/**
 * Updates the join/leave button based on membership status.
 */
function updateJoinButton() {
    const btn = document.getElementById('clubJoinBtn');
    if (!btn) return;

    if (!isLoggedIn()) {
        btn.textContent = 'Sign In to Join';
        btn.onclick = () => window.location.href = 'login.html';
        return;
    }

    if (isMember) {
        btn.textContent = '✓ Member — Leave';
        btn.className = 'btn btn-outline btn-lg';
    } else {
        btn.textContent = 'Join Club';
        btn.className = 'btn btn-accent btn-lg';
    }
}

/**
 * Toggles club membership (join/leave).
 */
async function toggleClubMembership() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    if (!currentClubId) return;

    try {
        if (isMember) {
            await api.leaveClub(currentClubId);
            isMember = false;
            showToast('Left the club', 'info');
        } else {
            await api.joinClub(currentClubId);
            isMember = true;
            showToast('Welcome to the club!', 'success');
        }
        updateJoinButton();

        // Reload club detail to update member count
        const club = await api.getClub(currentClubId);
        document.getElementById('clubDetailMembers').textContent = `👥 ${club.member_count || 0} Members`;

    } catch (error) {
        showToast(error.message, 'error');
    }
}

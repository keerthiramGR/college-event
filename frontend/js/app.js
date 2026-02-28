/**
 * App Module — Core Application Logic
 * Global utilities: navigation, mobile menu, toasts, scroll animations.
 */

// ============================================================
// Initialize on Page Load
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Update navbar auth state
    updateNavAuth();

    // Initialize scroll reveal animations
    initScrollReveal();

    // Add navbar scroll effect
    initNavbarScroll();
});

// ============================================================
// Mobile Menu Toggle
// ============================================================

/**
 * Toggles the mobile navigation menu open/closed.
 */
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('open');
    }
}

// ============================================================
// Dashboard Sidebar Tab Switching
// ============================================================

/**
 * Switches between dashboard tabs (student dashboard).
 * @param {string}      tabId - ID suffix of the tab to show
 * @param {HTMLElement}  el    - The clicked sidebar link
 */
function showDashTab(tabId, el) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    // Show selected tab
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.add('active');

    // Update active sidebar link
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    if (el) el.classList.add('active');

    return false;
}

/**
 * Switches between admin dashboard tabs.
 * @param {string}      tabId - ID suffix of the tab to show
 * @param {HTMLElement}  el    - The clicked sidebar link
 */
function showAdminTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    if (el) el.classList.add('active');

    return false;
}

/**
 * Switches tabs on the club detail page.
 * @param {string}      tabId - ID suffix of the tab
 * @param {HTMLElement}  el    - The clicked tab button
 */
function showClubDetailTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (el) el.classList.add('active');
}

// ============================================================
// Toast Notifications
// ============================================================

/**
 * Shows a toast notification at the top-right of the screen.
 * @param {string} message - Toast message text
 * @param {string} type    - 'success', 'error', or 'info'
 * @param {number} duration - Duration in ms (default 3500)
 */
function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `
        <span style="font-size:1.2rem;">${icons[type] || 'ℹ️'}</span>
        <span style="flex:1;">${message}</span>
        <button onclick="this.parentElement.remove()" 
                style="background:none;border:none;color:var(--neutral-400);cursor:pointer;font-size:1.1rem;">✕</button>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================================
// Scroll Reveal Animation
// ============================================================

/**
 * Initializes scroll-based reveal animations for elements with .reveal class.
 */
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    if (reveals.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    reveals.forEach(el => observer.observe(el));
}

// ============================================================
// Navbar Scroll Effect
// ============================================================

/**
 * Adds a background opacity effect to the navbar on scroll.
 */
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 14, 39, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 14, 39, 0.85)';
        }
    });
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Formats an ISO date string to a human-readable format.
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Formats a date to display only the date (no time).
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDateShort(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Returns the CSS class suffix for an event category.
 * @param {string} category
 * @returns {string}
 */
function getCategoryClass(category) {
    const map = { 'Technical': 'technical', 'Cultural': 'cultural', 'Sports': 'sports' };
    return map[category] || 'technical';
}

/**
 * Returns an emoji icon for an event category.
 * @param {string} category
 * @returns {string}
 */
function getCategoryIcon(category) {
    const map = { 'Technical': '💻', 'Cultural': '🎭', 'Sports': '🏆' };
    return map[category] || '📅';
}

/**
 * Returns the badge class for an event status.
 * @param {string} status
 * @returns {string}
 */
function getStatusBadge(status) {
    const map = {
        'upcoming': 'badge-success',
        'ongoing': 'badge-info',
        'completed': 'badge-warning',
        'cancelled': 'badge-error',
    };
    return map[status] || 'badge-info';
}

/**
 * Gets URL query parameter value.
 * @param {string} param - Parameter name
 * @returns {string|null} Parameter value
 */
function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
}

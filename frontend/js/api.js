/**
 * API Client Module
 * Centralized fetch wrapper for all backend API calls.
 * Handles authentication headers, error responses, and base URL config.
 */

// ============================================================
// Configuration
// ============================================================

// Base URL — change this to your Vercel backend URL in production
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api'
    : '/api';  // Netlify proxy handles routing in production

// ============================================================
// Core API Client
// ============================================================

const api = {
    /**
     * Makes an authenticated API request.
     * Automatically attaches JWT token from localStorage.
     * 
     * @param {string} endpoint - API endpoint path (e.g., '/events')
     * @param {object} options - Fetch options (method, body, etc.)
     * @returns {Promise<object>} Response data
     */
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('access_token');

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Attach auth token if available
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            // Handle non-OK responses
            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Request failed' }));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error.message);
            throw error;
        }
    },

    // ============================================================
    // Auth Endpoints
    // ============================================================

    /** Login with Google ID token */
    async googleLogin(idToken) {
        return this.request('/auth/google-login', {
            method: 'POST',
            body: JSON.stringify({ token: idToken }),
        });
    },

    /** Get current user info */
    async getCurrentUser() {
        return this.request('/auth/me');
    },

    // ============================================================
    // Event Endpoints
    // ============================================================

    /** Get all events with optional filters */
    async getEvents(params = {}) {
        const query = new URLSearchParams();
        if (params.category) query.set('category', params.category);
        if (params.status) query.set('status', params.status);
        if (params.search) query.set('search', params.search);
        if (params.limit) query.set('limit', params.limit);
        if (params.offset) query.set('offset', params.offset);
        const qs = query.toString();
        return this.request(`/events${qs ? '?' + qs : ''}`);
    },

    /** Get single event by ID */
    async getEvent(eventId) {
        return this.request(`/events/${eventId}`);
    },

    /** Create a new event (admin) */
    async createEvent(eventData) {
        return this.request('/events', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    },

    /** Update an event (admin) */
    async updateEvent(eventId, eventData) {
        return this.request(`/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(eventData),
        });
    },

    /** Delete an event (admin) */
    async deleteEvent(eventId) {
        return this.request(`/events/${eventId}`, {
            method: 'DELETE',
        });
    },

    // ============================================================
    // Club Endpoints
    // ============================================================

    /** Get all clubs */
    async getClubs(params = {}) {
        const query = new URLSearchParams();
        if (params.search) query.set('search', params.search);
        const qs = query.toString();
        return this.request(`/clubs${qs ? '?' + qs : ''}`);
    },

    /** Get single club by ID */
    async getClub(clubId) {
        return this.request(`/clubs/${clubId}`);
    },

    /** Create a new club (admin) */
    async createClub(clubData) {
        return this.request('/clubs', {
            method: 'POST',
            body: JSON.stringify(clubData),
        });
    },

    /** Update a club (admin) */
    async updateClub(clubId, clubData) {
        return this.request(`/clubs/${clubId}`, {
            method: 'PUT',
            body: JSON.stringify(clubData),
        });
    },

    /** Delete a club (admin) */
    async deleteClub(clubId) {
        return this.request(`/clubs/${clubId}`, {
            method: 'DELETE',
        });
    },

    /** Get club announcements */
    async getClubAnnouncements(clubId) {
        return this.request(`/clubs/${clubId}/announcements`);
    },

    /** Create club announcement (admin) */
    async createClubAnnouncement(clubId, data) {
        return this.request(`/clubs/${clubId}/announcements`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /** Get club members */
    async getClubMembers(clubId) {
        return this.request(`/clubs/${clubId}/members`);
    },

    // ============================================================
    // Registration Endpoints
    // ============================================================

    /** Register for an event */
    async registerForEvent(eventId) {
        return this.request(`/registrations/events/${eventId}`, {
            method: 'POST',
        });
    },

    /** Unregister from an event */
    async unregisterFromEvent(eventId) {
        return this.request(`/registrations/events/${eventId}`, {
            method: 'DELETE',
        });
    },

    /** Get my event registrations */
    async getMyEventRegistrations() {
        return this.request('/registrations/events/my');
    },

    /** Join a club */
    async joinClub(clubId) {
        return this.request(`/registrations/clubs/${clubId}`, {
            method: 'POST',
        });
    },

    /** Leave a club */
    async leaveClub(clubId) {
        return this.request(`/registrations/clubs/${clubId}`, {
            method: 'DELETE',
        });
    },

    /** Get my club memberships */
    async getMyClubMemberships() {
        return this.request('/registrations/clubs/my');
    },

    /** Get registered users for an event (admin) */
    async getEventRegistrations(eventId) {
        return this.request(`/registrations/events/${eventId}/users`);
    },

    /** Get all users (admin) */
    async getAllUsers() {
        return this.request('/registrations/admin/all-users');
    },

    /** Make user admin */
    async makeAdmin(userId) {
        return this.request(`/auth/make-admin/${userId}`, {
            method: 'PUT',
        });
    },
};

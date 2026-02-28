/**
 * Authentication Module
 * Handles Google OAuth sign-in, JWT session management, and logout.
 */

// ============================================================
// Configuration — Replace with your Google Client ID
// ============================================================
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

// ============================================================
// Session Management
// ============================================================

/**
 * Checks if the user is currently logged in.
 * @returns {boolean}
 */
function isLoggedIn() {
    return !!localStorage.getItem('access_token') && !!localStorage.getItem('user');
}

/**
 * Gets the current user data from localStorage.
 * @returns {object|null} User data or null
 */
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

/**
 * Gets the current user's role.
 * @returns {string} 'student' or 'admin'
 */
function getUserRole() {
    const user = getCurrentUser();
    return user ? user.role : 'student';
}

/**
 * Saves the auth token and user data to localStorage.
 * @param {string} token - JWT access token
 * @param {object} user - User data object
 */
function saveAuth(token, user) {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Clears all auth data from localStorage.
 */
function clearAuth() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
}

// ============================================================
// Google OAuth Sign-In
// ============================================================

/**
 * Initiates Google Sign-In flow.
 * Uses the Google Identity Services library.
 */
function handleGoogleSignIn() {
    // Check if Google Identity Services is loaded
    if (typeof google === 'undefined' || !google.accounts) {
        // Fallback: demo mode for testing without Google credentials
        console.warn('Google Identity Services not loaded. Using demo mode.');
        demoLogin();
        return;
    }

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
    });

    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to button-based sign-in
            google.accounts.id.renderButton(
                document.getElementById('googleSignInBtn'),
                { theme: 'outline', size: 'large', width: 350 }
            );
        }
    });
}

/**
 * Callback handler for Google Sign-In response.
 * Sends the ID token to the backend for verification.
 * @param {object} response - Google credential response
 */
async function handleGoogleCallback(response) {
    try {
        showToast('Signing you in...', 'info');

        // Send ID token to backend
        const authResult = await api.googleLogin(response.credential);

        // Save auth data
        saveAuth(authResult.access_token, authResult.user);

        showToast(`Welcome, ${authResult.user.name}!`, 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        showToast('Login failed: ' + error.message, 'error');
        console.error('Google login error:', error);
    }
}

// ============================================================
// Demo Mode Login (for testing without Google OAuth)
// ============================================================

/**
 * Demo login for testing purposes.
 * Creates a fake user session to test the UI without Google credentials.
 */
function demoLogin() {
    const demoUser = {
        id: 'demo-user-001',
        email: 'student@college.edu',
        name: 'Demo Student',
        avatar_url: '',
        role: 'student',
    };

    saveAuth('demo-token-not-for-production', demoUser);
    showToast(`Welcome, ${demoUser.name}! (Demo Mode)`, 'success');

    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

/**
 * Demo admin login for testing admin dashboard.
 */
function demoAdminLogin() {
    const demoAdmin = {
        id: 'demo-admin-001',
        email: 'admin@college.edu',
        name: 'Demo Admin',
        avatar_url: '',
        role: 'admin',
    };

    saveAuth('demo-admin-token', demoAdmin);
    showToast(`Welcome, ${demoAdmin.name}! (Admin Demo)`, 'success');

    setTimeout(() => {
        window.location.href = 'admin.html';
    }, 1000);
}

// ============================================================
// Logout
// ============================================================

/**
 * Logs the user out — clears session and redirects to home page.
 */
function logout() {
    clearAuth();
    showToast('Logged out successfully', 'info');

    // Revoke Google session if available
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// ============================================================
// UI Updates
// ============================================================

/**
 * Updates the navbar to reflect the current auth state.
 * Shows user avatar and name when logged in, sign-in button when not.
 */
function updateNavAuth() {
    const loginBtn = document.getElementById('loginBtnNav');
    const userMenu = document.getElementById('userMenuNav');
    const navUserName = document.getElementById('navUserName');
    const navAvatar = document.getElementById('navAvatar');

    if (!loginBtn || !userMenu) return;

    if (isLoggedIn()) {
        const user = getCurrentUser();
        loginBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userMenu.classList.remove('hidden');

        if (navUserName) navUserName.textContent = user.name;
        if (navAvatar) {
            navAvatar.src = user.avatar_url || generateAvatar(user.name);
            navAvatar.alt = user.name;
        }
    } else {
        loginBtn.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

/**
 * Generates a simple colored avatar placeholder using initials.
 * @param {string} name - User's name
 * @returns {string} Data URI for avatar image
 */
function generateAvatar(name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];
    const color = colors[name.length % colors.length];

    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(20, 20, 20, 0, Math.PI * 2);
    ctx.fill();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 20, 20);

    return canvas.toDataURL();
}

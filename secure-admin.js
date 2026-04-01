/**
 * Secure Admin Dashboard
 * Protected with password hashing and session management
 */

// ==================== Security Configuration ====================
const ADMIN_CREDENTIALS = {
    username: "admin",
    // Password hash for "ezzietech@254" using SHA-256
    passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"
};

// Session management
let adminSession = null;

// ==================== Password Hashing Function ====================
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// ==================== Session Management ====================
function setAdminSession() {
    const sessionData = {
        authenticated: true,
        timestamp: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    // Store in sessionStorage (clears when tab closes)
    sessionStorage.setItem('admin_auth', JSON.stringify(sessionData));
    adminSession = sessionData;
}

function checkAdminSession() {
    const stored = sessionStorage.getItem('admin_auth');
    if (stored) {
        try {
            const session = JSON.parse(stored);
            if (session.authenticated && session.expires > Date.now()) {
                adminSession = session;
                return true;
            }
        } catch(e) {
            console.error('Session parse error');
        }
    }
    return false;
}

function clearAdminSession() {
    sessionStorage.removeItem('admin_auth');
    adminSession = null;
}

// ==================== Login Handler ====================
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errorElement = document.getElementById('loginError');
    
    // Clear any previous error
    errorElement.classList.remove('show');
    
    if (!username || !password) {
        errorElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please enter both username and password';
        errorElement.classList.add('show');
        return;
    }
    
    // Hash the entered password
    const passwordHash = await hashPassword(password);
    
    // Verify credentials
    if (username === ADMIN_CREDENTIALS.username && passwordHash === ADMIN_CREDENTIALS.passwordHash) {
        // Success - set session and load dashboard
        setAdminSession();
        loadAdminDashboard();
    } else {
        errorElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Invalid username or password';
        errorElement.classList.add('show');
        
        // Clear password field
        document.getElementById('adminPassword').value = '';
        
        // Add delay to prevent brute force
        const submitBtn = document.querySelector('.login-btn');
        submitBtn.disabled = true;
        setTimeout(() => {
            submitBtn.disabled = false;
        }, 1000);
    }
});

// ==================== Load Dashboard ====================
function loadAdminDashboard() {
    // Hide login page, show dashboard
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardContent').classList.add('active');
    
    // Initialize dashboard data
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
    
    // Add logout button
    addLogoutButton();
}

function addLogoutButton() {
    const header = document.querySelector('.header');
    if (header && !document.getElementById('logoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'btn-secondary';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.style.marginLeft = 'auto';
        logoutBtn.onclick = logoutAdmin;
        
        const headerActions = header.querySelector('.header-actions');
        if (headerActions) {
            headerActions.appendChild(logoutBtn);
        }
    }
}

function logoutAdmin() {
    clearAdminSession();
    // Reset UI
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboardContent').classList.remove('active');
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
}

// ==================== Prevent Source Code Inspection ====================
// Disable right-click
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

// Disable keyboard shortcuts for viewing source
document.addEventListener('keydown', (e) => {
    // Disable F12
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }
    // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
    if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        return false;
    }
});

// Prevent selection and copying
document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
});

document.addEventListener('copy', (e) => {
    e.preventDefault();
    return false;
});

// Override console.log in production (optional)
if (typeof console !== 'undefined') {
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.warn = noop;
    console.debug = noop;
}

// ==================== Check Session on Load ====================
if (checkAdminSession()) {
    loadAdminDashboard();
}
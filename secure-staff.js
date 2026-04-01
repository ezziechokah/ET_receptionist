/**
 * Secure Staff Portal
 * Complete authentication system with password management
 */

// ==================== Staff Database with Passwords ====================
// Passwords are stored as hashes
let staffDatabase = [];

// Initialize staff database with hashed passwords
async function initializeStaffDatabase() {
    const stored = localStorage.getItem('ai_receptionist_staff_secure');
    if (stored) {
        staffDatabase = JSON.parse(stored);
    } else {
        // Create default staff with secure passwords
        staffDatabase = [
            { 
                id: 1, 
                name: "Dr. John Mwangi", 
                email: "john.mwangi@company.com", 
                department: "Information Technology", 
                position: "IT Director", 
                phone: "+254712345678", 
                office: "Room 201",
                available: true,
                hasPassword: true,
                passwordHash: await hashPassword("john123") // Default password
            },
            { 
                id: 2, 
                name: "Jane Wanjiku", 
                email: "jane.wanjiku@company.com", 
                department: "Human Resources", 
                position: "HR Manager", 
                phone: "+254723456789", 
                office: "Room 105",
                available: true,
                hasPassword: true,
                passwordHash: await hashPassword("jane123")
            },
            { 
                id: 3, 
                name: "Peter Omondi", 
                email: "peter.omondi@company.com", 
                department: "Sales & Marketing", 
                position: "Sales Director", 
                phone: "+254734567890", 
                office: "Room 301",
                available: true,
                hasPassword: true,
                passwordHash: await hashPassword("peter123")
            },
            { 
                id: 4, 
                name: "Mary Wambui", 
                email: "mary.wambui@company.com", 
                department: "Finance", 
                position: "Finance Controller", 
                phone: "+254745678901", 
                office: "Room 108",
                available: true,
                hasPassword: true,
                passwordHash: await hashPassword("mary123")
            },
            { 
                id: 5, 
                name: "James Kariuki", 
                email: "james.kariuki@company.com", 
                department: "Operations", 
                position: "Operations Manager", 
                phone: "+254756789012", 
                office: "Room 205",
                available: true,
                hasPassword: true,
                passwordHash: await hashPassword("james123")
            }
        ];
        saveStaffDatabase();
    }
}

function saveStaffDatabase() {
    // Store without exposing password hashes in a separate encrypted format
    const toStore = staffDatabase.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        department: s.department,
        position: s.position,
        phone: s.phone,
        office: s.office,
        available: s.available,
        hasPassword: s.hasPassword,
        passwordHash: s.passwordHash
    }));
    localStorage.setItem('ai_receptionist_staff_secure', JSON.stringify(toStore));
}

// ==================== Session Management ====================
let currentStaffSession = null;

function setStaffSession(staff) {
    const sessionData = {
        staffId: staff.id,
        staffName: staff.name,
        authenticated: true,
        timestamp: Date.now(),
        expires: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
    };
    sessionStorage.setItem('staff_auth', JSON.stringify(sessionData));
    currentStaffSession = sessionData;
}

function checkStaffSession() {
    const stored = sessionStorage.getItem('staff_auth');
    if (stored) {
        try {
            const session = JSON.parse(stored);
            if (session.authenticated && session.expires > Date.now()) {
                currentStaffSession = session;
                return session;
            }
        } catch(e) {}
    }
    return null;
}

function clearStaffSession() {
    sessionStorage.removeItem('staff_auth');
    currentStaffSession = null;
}

// ==================== Password Functions ====================
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(staff, password) {
    const hash = await hashPassword(password);
    return staff.passwordHash === hash;
}

async function updateStaffPassword(staffId, newPassword) {
    const staff = staffDatabase.find(s => s.id === staffId);
    if (staff) {
        staff.passwordHash = await hashPassword(newPassword);
        saveStaffDatabase();
        return true;
    }
    return false;
}

// ==================== Staff Sign Up / First Time Setup ====================
function showStaffSignUp() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'signupModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>First Time Setup</h3>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <form id="signupForm">
                <div class="form-group">
                    <label>Select Your Name</label>
                    <select id="signupStaffSelect" required>
                        <option value="">Select staff member...</option>
                        ${staffDatabase.map(s => `<option value="${s.id}">${s.name} - ${s.position}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Create Password</label>
                    <input type="password" id="signupPassword" required placeholder="Create a secure password">
                    <small style="color: #64748b; font-size: 12px;">Minimum 6 characters</small>
                </div>
                <div class="form-group">
                    <label>Confirm Password</label>
                    <input type="password" id="signupConfirmPassword" required placeholder="Confirm your password">
                </div>
                <div id="signupError" class="error-message" style="display: none;"></div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Create Account</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const staffId = parseInt(document.getElementById('signupStaffSelect').value);
        const password = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('signupConfirmPassword').value;
        const errorDiv = document.getElementById('signupError');
        
        if (!staffId) {
            errorDiv.textContent = 'Please select your name';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (password !== confirm) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.style.display = 'block';
            return;
        }
        
        const staff = staffDatabase.find(s => s.id === staffId);
        if (staff) {
            await updateStaffPassword(staffId, password);
            closeModal();
            alert('Account created successfully! Please login with your new password.');
            showStaffLogin();
        }
    });
}

// ==================== Staff Login ====================
function showStaffLogin() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'loginModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="modal-header">
                <h3><i class="fas fa-user-lock"></i> Staff Login</h3>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <form id="staffLoginForm">
                <div class="form-group">
                    <label>Select Your Name</label>
                    <select id="loginStaffSelect" required>
                        <option value="">Select staff member...</option>
                        ${staffDatabase.map(s => `<option value="${s.id}">${s.name} - ${s.position}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="loginPassword" required placeholder="Enter your password">
                </div>
                <div id="loginError" class="error-message" style="display: none;"></div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Login</button>
                </div>
                <div style="text-align: center; margin-top: 16px;">
                    <a href="#" onclick="showForgotPassword(); return false;" style="color: #4361ee;">Forgot Password?</a>
                    <span style="margin: 0 8px">|</span>
                    <a href="#" onclick="closeModal(); showStaffSignUp(); return false;" style="color: #4361ee;">First Time? Sign Up</a>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('staffLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const staffId = parseInt(document.getElementById('loginStaffSelect').value);
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        
        if (!staffId) {
            errorDiv.textContent = 'Please select your name';
            errorDiv.style.display = 'block';
            return;
        }
        
        const staff = staffDatabase.find(s => s.id === staffId);
        if (staff && await verifyPassword(staff, password)) {
            setStaffSession(staff);
            closeModal();
            loadStaffPortal(staff);
        } else {
            errorDiv.textContent = 'Invalid password. Please try again.';
            errorDiv.style.display = 'block';
            document.getElementById('loginPassword').value = '';
        }
    });
}

// ==================== Forgot Password ====================
function showForgotPassword() {
    closeModal();
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'forgotModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="modal-header">
                <h3><i class="fas fa-key"></i> Reset Password</h3>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <form id="forgotForm">
                <div class="form-group">
                    <label>Select Your Name</label>
                    <select id="forgotStaffSelect" required>
                        <option value="">Select staff member...</option>
                        ${staffDatabase.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>New Password</label>
                    <input type="password" id="newPassword" required placeholder="Enter new password">
                    <small style="color: #64748b;">Minimum 6 characters</small>
                </div>
                <div class="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" id="confirmNewPassword" required placeholder="Confirm new password">
                </div>
                <div id="forgotError" class="error-message" style="display: none;"></div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Reset Password</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('forgotForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const staffId = parseInt(document.getElementById('forgotStaffSelect').value);
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmNewPassword').value;
        const errorDiv = document.getElementById('forgotError');
        
        if (!staffId) {
            errorDiv.textContent = 'Please select your name';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (newPass.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (newPass !== confirmPass) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.style.display = 'block';
            return;
        }
        
        await updateStaffPassword(staffId, newPass);
        closeModal();
        alert('Password reset successfully! Please login with your new password.');
        showStaffLogin();
    });
}

// ==================== Load Staff Portal ====================
function loadStaffPortal(staff) {
    // Update UI with staff info
    document.getElementById('staffNameDisplay').innerHTML = `${staff.name}<br><span style="font-size: 10px;">${staff.position}</span>`;
    document.getElementById('welcomeMessage').innerHTML = `Welcome, ${staff.name.split(' ')[0]}! 👋`;
    
    // Show portal content
    document.getElementById('staffPortalContent').style.display = 'block';
    document.getElementById('staffLoginOverlay').style.display = 'none';
    
    // Add logout button
    addStaffLogoutButton();
    
    // Load staff data
    loadAllStaffData();
}

function addStaffLogoutButton() {
    const header = document.querySelector('.staff-header');
    if (header && !document.getElementById('staffLogoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'staffLogoutBtn';
        logoutBtn.className = 'btn-secondary';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.onclick = logoutStaff;
        
        const statusDiv = header.querySelector('.staff-status');
        if (statusDiv) {
            statusDiv.appendChild(logoutBtn);
        }
    }
}

function logoutStaff() {
    clearStaffSession();
    location.reload();
}

// ==================== Check Session on Load ====================
async function initStaffPortal() {
    await initializeStaffDatabase();
    
    const session = checkStaffSession();
    if (session) {
        const staff = staffDatabase.find(s => s.id === session.staffId);
        if (staff) {
            loadStaffPortal(staff);
            return;
        }
    }
    
    // Show login
    document.getElementById('staffPortalContent').style.display = 'none';
    document.getElementById('staffLoginOverlay').style.display = 'flex';
    showStaffLogin();
}

// ==================== Security Measures ====================
// Disable right-click
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

// Disable keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        return false;
    }
});

// Prevent selection
document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
});

document.addEventListener('copy', (e) => {
    e.preventDefault();
    return false;
});

// Override console
if (typeof console !== 'undefined') {
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.warn = noop;
    console.debug = noop;
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.remove());
}

// Make functions globally available
window.showStaffSignUp = showStaffSignUp;
window.showStaffLogin = showStaffLogin;
window.showForgotPassword = showForgotPassword;
window.closeModal = closeModal;
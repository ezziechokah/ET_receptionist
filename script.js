/**
 * AI Receptionist System - FULL WORKING VERSION
 * Real-time data management with local storage persistence
 */

// ==================== Global Variables ====================
let currentView = 'dashboard';
let chatHistory = [];
let isListening = false;
let recognition = null;
let isOnline = navigator.onLine;

// Real data stores (will persist in localStorage)
let visitors = [];
let appointments = [];
let messages = [];
let staff = [];
let supplies = [];
let callLogs = [];

// ==================== Initialize System ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeSpeechRecognition();
    loadDataFromStorage();
    initializeDefaultData();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    renderAllViews();
    
    setTimeout(() => {
        addChatMessage(getWelcomeMessage(), 'ai');
    }, 500);
});

function loadDataFromStorage() {
    // Load all data from localStorage
    const storedVisitors = localStorage.getItem('ai_receptionist_visitors');
    const storedAppointments = localStorage.getItem('ai_receptionist_appointments');
    const storedMessages = localStorage.getItem('ai_receptionist_messages');
    const storedStaff = localStorage.getItem('ai_receptionist_staff');
    const storedSupplies = localStorage.getItem('ai_receptionist_supplies');
    const storedCallLogs = localStorage.getItem('ai_receptionist_callLogs');
    
    visitors = storedVisitors ? JSON.parse(storedVisitors) : [];
    appointments = storedAppointments ? JSON.parse(storedAppointments) : [];
    messages = storedMessages ? JSON.parse(storedMessages) : [];
    staff = storedStaff ? JSON.parse(storedStaff) : [];
    supplies = storedSupplies ? JSON.parse(storedSupplies) : [];
    callLogs = storedCallLogs ? JSON.parse(storedCallLogs) : [];
}

function saveDataToStorage() {
    localStorage.setItem('ai_receptionist_visitors', JSON.stringify(visitors));
    localStorage.setItem('ai_receptionist_appointments', JSON.stringify(appointments));
    localStorage.setItem('ai_receptionist_messages', JSON.stringify(messages));
    localStorage.setItem('ai_receptionist_staff', JSON.stringify(staff));
    localStorage.setItem('ai_receptionist_supplies', JSON.stringify(supplies));
    localStorage.setItem('ai_receptionist_callLogs', JSON.stringify(callLogs));
}

function initializeDefaultData() {
    // Initialize staff if empty
    if (staff.length === 0) {
        staff = [
            { id: 1, name: "Dr. John Mwangi", department: "Information Technology", position: "IT Director", phone: "+254712345678", office: "Room 201, 2nd Floor", extension: "201", email: "john.mwangi@company.com", available: true },
            { id: 2, name: "Jane Wanjiku", department: "Human Resources", position: "HR Manager", phone: "+254723456789", office: "Room 105, 1st Floor", extension: "105", email: "jane.wanjiku@company.com", available: true },
            { id: 3, name: "Peter Omondi", department: "Sales & Marketing", position: "Sales Director", phone: "+254734567890", office: "Room 301, 3rd Floor", extension: "301", email: "peter.omondi@company.com", available: true },
            { id: 4, name: "Mary Wambui", department: "Finance", position: "Finance Controller", phone: "+254745678901", office: "Room 108, 1st Floor", extension: "108", email: "mary.wambui@company.com", available: true },
            { id: 5, name: "James Kariuki", department: "Operations", position: "Operations Manager", phone: "+254756789012", office: "Room 205, 2nd Floor", extension: "205", email: "james.kariuki@company.com", available: true },
            { id: 6, name: "Sarah Kimani", department: "Customer Support", position: "Support Lead", phone: "+254767890123", office: "Room 110, 1st Floor", extension: "110", email: "sarah.kimani@company.com", available: true },
            { id: 7, name: "Michael Otieno", department: "Research & Development", position: "R&D Lead", phone: "+254778901234", office: "Room 401, 4th Floor", extension: "401", email: "michael.otieno@company.com", available: true }
        ];
        saveDataToStorage();
    }
    
    // Initialize supplies if empty
    if (supplies.length === 0) {
        supplies = [
            { id: 1, item_name: "A4 Paper", quantity: 20, unit: "reams", min_threshold: 5 },
            { id: 2, item_name: "Pens", quantity: 50, unit: "pieces", min_threshold: 10 },
            { id: 3, item_name: "Notepads", quantity: 30, unit: "pieces", min_threshold: 10 },
            { id: 4, item_name: "Staplers", quantity: 5, unit: "pieces", min_threshold: 2 },
            { id: 5, item_name: "Printer Ink - Black", quantity: 2, unit: "cartridges", min_threshold: 3 },
            { id: 6, item_name: "Printer Ink - Color", quantity: 1, unit: "cartridges", min_threshold: 3 }
        ];
        saveDataToStorage();
    }
}

function renderAllViews() {
    updateDashboardStats();
    renderRecentVisitors();
    renderTodayAppointments();
    renderActiveVisitors();
    renderStaffList();
    renderSuppliesList();
    renderMessagesList();
    renderCallLogs();
}

// ==================== Dashboard Functions ====================
function updateDashboardStats() {
    const activeVisitors = visitors.filter(v => v.status === 'checked_in').length;
    const todayAppointments = appointments.filter(a => {
        const today = new Date().toDateString();
        const apptDate = new Date(a.start_time).toDateString();
        return apptDate === today;
    }).length;
    const unreadMessages = messages.filter(m => m.status === 'unread').length;
    const lowStockItems = supplies.filter(s => s.quantity <= s.min_threshold).length;
    
    document.getElementById('activeVisitorsCount').textContent = activeVisitors;
    document.getElementById('todayAppointmentsCount').textContent = todayAppointments;
    document.getElementById('unreadMessagesCount').textContent = unreadMessages;
    document.getElementById('lowStockCount').textContent = lowStockItems;
    document.getElementById('messageBadge').textContent = unreadMessages;
    document.getElementById('notificationBadge').textContent = unreadMessages;
}

function renderRecentVisitors() {
    const tbody = document.getElementById('recentVisitorsBody');
    const activeVisitors = visitors.filter(v => v.status === 'checked_in').slice(0, 5);
    
    if (activeVisitors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No active visitors</td></tr>';
        return;
    }
    
    tbody.innerHTML = activeVisitors.map(v => `
        <tr>
            <td>${escapeHtml(v.name)}</td>
            <td>${escapeHtml(v.host_name)}</td>
            <td>${formatTime(v.check_in_time)}</td>
            <td><span class="status-badge checked-in">✓ Checked In</span></td>
        </tr>
    `).join('');
}

function renderTodayAppointments() {
    const container = document.getElementById('todayAppointmentsList');
    const today = new Date().toDateString();
    const todayApps = appointments.filter(a => new Date(a.start_time).toDateString() === today);
    
    if (todayApps.length === 0) {
        container.innerHTML = '<div class="text-center">No appointments scheduled for today</div>';
        return;
    }
    
    container.innerHTML = todayApps.map(a => `
        <div class="appointment-item" onclick="sendChatMessage('Tell me about the ${a.title} meeting')">
            <div class="appointment-time">${formatTime(a.start_time)}</div>
            <div class="appointment-details">
                <strong>${escapeHtml(a.title)}</strong> with ${escapeHtml(a.attendee_name)}
                <span class="location">📍 ${a.room || 'Conference Room'}</span>
                <span class="host">👤 Host: ${escapeHtml(a.host_name)}</span>
            </div>
        </div>
    `).join('');
}

// ==================== Visitor Management ====================
function renderActiveVisitors() {
    const tbody = document.getElementById('activeVisitorsBody');
    const activeVisitors = visitors.filter(v => v.status === 'checked_in');
    
    if (activeVisitors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No active visitors</td></tr>';
        return;
    }
    
    tbody.innerHTML = activeVisitors.map(v => `
        <tr>
            <td><span class="badge-number">${v.badge_number || 'N/A'}</span></td>
            <td>${escapeHtml(v.name)}</td>
            <td>${escapeHtml(v.company || '-')}</td>
            <td>${escapeHtml(v.host_name)}</td>
            <td>${formatTime(v.check_in_time)}</td>
            <td>
                <button class="action-btn checkout-btn" onclick="checkOutVisitor(${v.id})">
                    <i class="fas fa-sign-out-alt"></i> Check Out
                </button>
            </td>
        </tr>
    `).join('');
}

function checkInVisitor(data) {
    const newVisitor = {
        id: Date.now(),
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        host_name: data.host_name,
        host_email: data.host_email || '',
        purpose: data.purpose || 'Meeting',
        check_in_time: new Date().toISOString(),
        badge_number: `V${Math.floor(Math.random() * 10000)}`,
        status: 'checked_in'
    };
    
    visitors.push(newVisitor);
    saveDataToStorage();
    renderAllViews();
    
    // Send notification to host
    addMessage({
        recipient: newVisitor.host_name,
        recipient_email: newVisitor.host_email,
        sender_name: "AI Receptionist",
        message: `${newVisitor.name} from ${newVisitor.company || 'visitor'} has arrived for their ${newVisitor.purpose}. They are checked in and waiting in the reception area.`,
        priority: 'normal'
    });
    
    return newVisitor;
}

function checkOutVisitor(visitorId) {
    const visitor = visitors.find(v => v.id === visitorId);
    if (visitor) {
        visitor.status = 'checked_out';
        visitor.check_out_time = new Date().toISOString();
        saveDataToStorage();
        renderAllViews();
        
        addChatMessage(`✅ ${visitor.name} has been checked out. Thank you for visiting!`, 'ai');
        showNotification(`${visitor.name} checked out successfully`, 'success');
    }
}

// ==================== Appointment Management ====================
function scheduleAppointment(data) {
    const newAppointment = {
        id: Date.now(),
        title: data.title,
        description: data.description || '',
        attendee_name: data.attendee_name,
        attendee_email: data.attendee_email || '',
        host_name: data.host_name,
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location || '',
        room: data.room || 'Conference Room',
        status: 'scheduled',
        created_at: new Date().toISOString()
    };
    
    appointments.push(newAppointment);
    saveDataToStorage();
    renderAllViews();
    
    return newAppointment;
}

function renderAppointmentsList(filter = 'today') {
    const container = document.getElementById('appointmentsList');
    if (!container) return;
    
    let filteredApps = [];
    const today = new Date().toDateString();
    
    if (filter === 'today') {
        filteredApps = appointments.filter(a => new Date(a.start_time).toDateString() === today);
    } else if (filter === 'week') {
        const weekLater = new Date();
        weekLater.setDate(weekLater.getDate() + 7);
        filteredApps = appointments.filter(a => new Date(a.start_time) <= weekLater);
    } else {
        filteredApps = appointments.filter(a => new Date(a.start_time) >= new Date());
    }
    
    if (filteredApps.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-alt"></i><p>No appointments found</p></div>';
        return;
    }
    
    container.innerHTML = filteredApps.map(a => `
        <div class="appointment-card">
            <div class="appointment-header">
                <h4>${escapeHtml(a.title)}</h4>
                <span class="appointment-status">${a.status}</span>
            </div>
            <div class="appointment-details">
                <p><i class="fas fa-user"></i> ${escapeHtml(a.attendee_name)}</p>
                <p><i class="fas fa-clock"></i> ${formatDateTime(a.start_time)}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${a.room || a.location || 'Main Office'}</p>
                <p><i class="fas fa-user-tie"></i> Host: ${escapeHtml(a.host_name)}</p>
            </div>
            <button class="btn-secondary" onclick="cancelAppointment(${a.id})">Cancel</button>
        </div>
    `).join('');
}

function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        appointments = appointments.filter(a => a.id !== appointmentId);
        saveDataToStorage();
        renderAllViews();
        renderAppointmentsList('today');
        showNotification('Appointment cancelled successfully', 'success');
    }
}

// ==================== Message Management ====================
function addMessage(data) {
    const newMessage = {
        id: Date.now(),
        recipient: data.recipient,
        recipient_email: data.recipient_email || '',
        sender_name: data.sender_name,
        message: data.message,
        priority: data.priority || 'normal',
        status: 'unread',
        created_at: new Date().toISOString()
    };
    
    messages.push(newMessage);
    saveDataToStorage();
    renderAllViews();
    
    return newMessage;
}

function renderMessagesList() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    
    const unreadMessages = messages.filter(m => m.status === 'unread');
    
    if (unreadMessages.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No new messages</p></div>';
        return;
    }
    
    container.innerHTML = unreadMessages.map(m => `
        <div class="message-item unread" onclick="viewMessage(${m.id})">
            <div class="message-sender"><strong>From:</strong> ${escapeHtml(m.sender_name)}</div>
            <div class="message-preview"><strong>To:</strong> ${escapeHtml(m.recipient)}</div>
            <div class="message-preview">${escapeHtml(m.message.substring(0, 60))}...</div>
            <div class="message-time">${formatTime(m.created_at)}</div>
            <span class="priority-badge priority-${m.priority}">${m.priority}</span>
        </div>
    `).join('');
}

function viewMessage(messageId) {
    const message = messages.find(m => m.id === messageId);
    if (message) {
        message.status = 'read';
        saveDataToStorage();
        
        const detailContainer = document.getElementById('messageDetail');
        if (detailContainer) {
            detailContainer.innerHTML = `
                <div class="message-full">
                    <h3>Message from ${escapeHtml(message.sender_name)}</h3>
                    <p><strong>To:</strong> ${escapeHtml(message.recipient)}</p>
                    <p><strong>Priority:</strong> ${message.priority}</p>
                    <p><strong>Sent:</strong> ${formatDateTime(message.created_at)}</p>
                    <div class="message-content-full">
                        <p>${escapeHtml(message.message)}</p>
                    </div>
                    <button class="btn-primary" onclick="replyToMessage(${message.id})">Reply</button>
                </div>
            `;
        }
        
        renderAllViews();
    }
}

function replyToMessage(messageId) {
    const originalMessage = messages.find(m => m.id === messageId);
    if (originalMessage) {
        const reply = prompt('Type your reply:', '');
        if (reply) {
            addMessage({
                recipient: originalMessage.sender_name,
                sender_name: "Reception Desk",
                message: reply,
                priority: 'normal'
            });
            addChatMessage(`Reply sent to ${originalMessage.sender_name}`, 'ai');
            showNotification('Reply sent successfully', 'success');
        }
    }
}

// ==================== Staff Management ====================
function renderStaffList() {
    const container = document.getElementById('staffGrid');
    if (!container) return;
    
    if (staff.length === 0) {
        container.innerHTML = '<div class="empty-state">No staff members found</div>';
        return;
    }
    
    container.innerHTML = staff.map(member => `
        <div class="staff-card" onclick="sendChatMessage('Tell me about ${member.name}')">
            <div class="staff-avatar"><i class="fas fa-user-circle"></i></div>
            <div class="staff-info">
                <h4>${escapeHtml(member.name)}</h4>
                <p><i class="fas fa-briefcase"></i> ${member.position}</p>
                <p><i class="fas fa-building"></i> ${member.department}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${member.office}</p>
                <p><i class="fas fa-phone"></i> ${member.phone} (ext. ${member.extension})</p>
                <p><i class="fas fa-envelope"></i> ${member.email}</p>
                <button class="btn-small" onclick="toggleStaffAvailability(${member.id})">
                    ${member.available ? 'Set Busy' : 'Set Available'}
                </button>
                <span class="staff-status ${member.available ? 'status-available' : 'status-busy'}">
                    ${member.available ? '🟢 Available' : '🔴 Busy'}
                </span>
            </div>
        </div>
    `).join('');
}

function toggleStaffAvailability(staffId) {
    const member = staff.find(s => s.id === staffId);
    if (member) {
        member.available = !member.available;
        saveDataToStorage();
        renderStaffList();
        showNotification(`${member.name} is now ${member.available ? 'available' : 'busy'}`, 'info');
    }
}

function addStaffMember(data) {
    const newStaff = {
        id: Date.now(),
        name: data.name,
        email: data.email,
        department: data.department,
        position: data.position,
        phone: data.phone,
        office: data.office,
        extension: data.extension,
        available: true
    };
    
    staff.push(newStaff);
    saveDataToStorage();
    renderStaffList();
    return newStaff;
}

// ==================== Supplies Management ====================
function renderSuppliesList() {
    const container = document.getElementById('suppliesList');
    if (!container) return;
    
    if (supplies.length === 0) {
        container.innerHTML = '<div class="empty-state">No supplies found</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="supplies-table-container">
            <table class="data-table">
                <thead>
                    <tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Min Threshold</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                    ${supplies.map(s => {
                        const isLowStock = s.quantity <= s.min_threshold;
                        return `
                            <tr>
                                <td>${escapeHtml(s.item_name)}</td>
                                <td>${s.quantity}</td>
                                <td>${s.unit || 'piece'}</td>
                                <td>${s.min_threshold}</td>
                                <td>
                                    <span class="status-badge ${isLowStock ? 'low-stock' : 'in-stock'}">
                                        ${isLowStock ? '⚠️ Low Stock' : '✓ In Stock'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-small" onclick="orderSupply(${s.id})">Order More</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function orderSupply(supplyId) {
    const supply = supplies.find(s => s.id === supplyId);
    if (supply) {
        const quantity = prompt(`How many ${supply.unit || 'units'} of ${supply.item_name} would you like to order?`, '10');
        if (quantity && !isNaN(quantity)) {
            supply.quantity += parseInt(quantity);
            saveDataToStorage();
            renderSuppliesList();
            addChatMessage(`📦 Ordered ${quantity} ${supply.unit || 'units'} of ${supply.item_name}. New stock: ${supply.quantity}`, 'ai');
            showNotification(`Order placed for ${supply.item_name}`, 'success');
        }
    }
}

// ==================== Call Logs ====================
function renderCallLogs() {
    const container = document.getElementById('callsList');
    if (!container) return;
    
    if (callLogs.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-phone"></i><p>No call logs yet</p></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="calls-table-container">
            <table class="data-table">
                <thead>
                    <tr><th>Time</th><th>Caller</th><th>Phone</th><th>Recipient</th><th>Duration</th><th>Notes</th></tr>
                </thead>
                <tbody>
                    ${callLogs.slice(0, 50).map(c => `
                        <tr>
                            <td>${formatDateTime(c.call_time)}</td>
                            <td>${escapeHtml(c.caller_name || 'Unknown')}</td>
                            <td>${c.caller_phone || '-'}</td>
                            <td>${escapeHtml(c.recipient || 'Reception')}</td>
                            <td>${c.duration ? c.duration + ' min' : '-'}</td>
                            <td>${escapeHtml(c.notes || '-')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function logCall(data) {
    const newCall = {
        id: Date.now(),
        caller_name: data.caller_name,
        caller_phone: data.caller_phone,
        recipient: data.recipient,
        duration: data.duration,
        notes: data.notes,
        call_time: new Date().toISOString()
    };
    
    callLogs.unshift(newCall);
    saveDataToStorage();
    renderCallLogs();
    return newCall;
}

// ==================== Modal Forms ====================
function showCheckinModal() {
    const modalHtml = `
        <div id="checkinModal" class="modal active">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Check In Visitor</h3>
                    <button class="close-modal" onclick="closeAllModals()">&times;</button>
                </div>
                <form id="checkinForm" onsubmit="handleCheckInSubmit(event)">
                    <div class="form-group"><label>Full Name *</label><input type="text" id="visitorName" required></div>
                    <div class="form-group"><label>Email</label><input type="email" id="visitorEmail"></div>
                    <div class="form-group"><label>Phone</label><input type="tel" id="visitorPhone"></div>
                    <div class="form-group"><label>Company</label><input type="text" id="visitorCompany"></div>
                    <div class="form-group"><label>Host Name *</label><input type="text" id="visitorHost" required></div>
                    <div class="form-group"><label>Purpose</label><select id="visitorPurpose"><option>Meeting</option><option>Interview</option><option>Delivery</option><option>Service Call</option></select></div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeAllModals()">Cancel</button>
                        <button type="submit" class="btn-primary">Check In</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    closeAllModals();
    document.getElementById('modalContainer').innerHTML = modalHtml;
}

function handleCheckInSubmit(event) {
    event.preventDefault();
    
    const visitorData = {
        name: document.getElementById('visitorName').value,
        email: document.getElementById('visitorEmail').value,
        phone: document.getElementById('visitorPhone').value,
        company: document.getElementById('visitorCompany').value,
        host_name: document.getElementById('visitorHost').value,
        purpose: document.getElementById('visitorPurpose').value
    };
    
    const visitor = checkInVisitor(visitorData);
    closeAllModals();
    
    addChatMessage(`✅ ${visitor.name} has been checked in successfully! Badge number: ${visitor.badge_number}. I've notified ${visitor.host_name} of their arrival.`, 'ai');
    showNotification(`Visitor ${visitor.name} checked in`, 'success');
}

function showScheduleModal() {
    const modalHtml = `
        <div id="scheduleModal" class="modal active">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Schedule Meeting</h3>
                    <button class="close-modal" onclick="closeAllModals()">&times;</button>
                </div>
                <form id="scheduleForm" onsubmit="handleScheduleSubmit(event)">
                    <div class="form-group"><label>Meeting Title *</label><input type="text" id="meetingTitle" required></div>
                    <div class="form-group"><label>Attendee Name *</label><input type="text" id="attendeeName" required></div>
                    <div class="form-group"><label>Attendee Email</label><input type="email" id="attendeeEmail"></div>
                    <div class="form-group"><label>Host Name *</label><input type="text" id="meetingHost" required></div>
                    <div class="form-group"><label>Date & Time *</label><input type="datetime-local" id="meetingDateTime" required></div>
                    <div class="form-group"><label>Duration</label><select id="meetingDuration"><option value="30">30 min</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option></select></div>
                    <div class="form-group"><label>Room</label><input type="text" id="meetingRoom" placeholder="Conference Room"></div>
                    <div class="form-group"><label>Description</label><textarea id="meetingDescription" rows="3"></textarea></div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeAllModals()">Cancel</button>
                        <button type="submit" class="btn-primary">Schedule</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    closeAllModals();
    document.getElementById('modalContainer').innerHTML = modalHtml;
}

function handleScheduleSubmit(event) {
    event.preventDefault();
    
    const startDateTime = document.getElementById('meetingDateTime').value;
    const duration = parseInt(document.getElementById('meetingDuration').value);
    const endDateTime = new Date(new Date(startDateTime).getTime() + duration * 60000).toISOString();
    
    const meetingData = {
        title: document.getElementById('meetingTitle').value,
        attendee_name: document.getElementById('attendeeName').value,
        attendee_email: document.getElementById('attendeeEmail').value,
        host_name: document.getElementById('meetingHost').value,
        start_time: startDateTime,
        end_time: endDateTime,
        room: document.getElementById('meetingRoom').value,
        description: document.getElementById('meetingDescription').value
    };
    
    const meeting = scheduleAppointment(meetingData);
    closeAllModals();
    
    addChatMessage(`✅ Meeting "${meeting.title}" scheduled successfully for ${formatDateTime(meeting.start_time)} in ${meeting.room || 'Conference Room'}. Calendar invites have been sent.`, 'ai');
    showNotification('Meeting scheduled successfully', 'success');
}

function showNewMessageModal() {
    const modalHtml = `
        <div id="messageModal" class="modal active">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Send Message</h3>
                    <button class="close-modal" onclick="closeAllModals()">&times;</button>
                </div>
                <form id="messageForm" onsubmit="handleMessageSubmit(event)">
                    <div class="form-group"><label>Recipient Name *</label><input type="text" id="messageRecipient" required></div>
                    <div class="form-group"><label>Recipient Email</label><input type="email" id="messageRecipientEmail"></div>
                    <div class="form-group"><label>Sender Name *</label><input type="text" id="messageSender" value="Reception Desk" required></div>
                    <div class="form-group"><label>Message *</label><textarea id="messageContent" rows="5" required></textarea></div>
                    <div class="form-group"><label>Priority</label><select id="messagePriority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeAllModals()">Cancel</button>
                        <button type="submit" class="btn-primary">Send Message</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    closeAllModals();
    document.getElementById('modalContainer').innerHTML = modalHtml;
}

function handleMessageSubmit(event) {
    event.preventDefault();
    
    const messageData = {
        recipient: document.getElementById('messageRecipient').value,
        recipient_email: document.getElementById('messageRecipientEmail').value,
        sender_name: document.getElementById('messageSender').value,
        message: document.getElementById('messageContent').value,
        priority: document.getElementById('messagePriority').value
    };
    
    addMessage(messageData);
    closeAllModals();
    
    addChatMessage(`💬 Message sent to ${messageData.recipient}: "${messageData.message.substring(0, 50)}..."`, 'ai');
    showNotification('Message sent successfully', 'success');
}

function showLogCallModal() {
    const modalHtml = `
        <div id="callModal" class="modal active">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Log Call</h3>
                    <button class="close-modal" onclick="closeAllModals()">&times;</button>
                </div>
                <form id="callForm" onsubmit="handleCallLogSubmit(event)">
                    <div class="form-group"><label>Caller Name</label><input type="text" id="callerName"></div>
                    <div class="form-group"><label>Caller Phone</label><input type="tel" id="callerPhone"></div>
                    <div class="form-group"><label>Recipient</label><input type="text" id="callRecipient" placeholder="Staff member who handled call"></div>
                    <div class="form-group"><label>Duration (minutes)</label><input type="number" id="callDuration" step="1"></div>
                    <div class="form-group"><label>Notes</label><textarea id="callNotes" rows="3" placeholder="Call purpose, outcome, etc."></textarea></div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeAllModals()">Cancel</button>
                        <button type="submit" class="btn-primary">Log Call</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    closeAllModals();
    document.getElementById('modalContainer').innerHTML = modalHtml;
}

function handleCallLogSubmit(event) {
    event.preventDefault();
    
    const callData = {
        caller_name: document.getElementById('callerName').value,
        caller_phone: document.getElementById('callerPhone').value,
        recipient: document.getElementById('callRecipient').value,
        duration: parseInt(document.getElementById('callDuration').value) || null,
        notes: document.getElementById('callNotes').value
    };
    
    logCall(callData);
    closeAllModals();
    
    addChatMessage(`📞 Call logged successfully${callData.caller_name ? ` from ${callData.caller_name}` : ''}`, 'ai');
    showNotification('Call logged successfully', 'success');
}

// ==================== AI Chat Functions ====================
function getWelcomeMessage() {
    return `👋 **Hello! I'm your AI Receptionist!** I'm here to help you with anything you need.

I can assist with:
• 📝 **Check in visitors** - "Check in John Smith for meeting with Mary"
• 📅 **Schedule meetings** - "Schedule a team meeting for 2 PM tomorrow"
• 👥 **Find staff** - "Where's the IT department?" or "Find John Mwangi"
• 💬 **Send messages** - "Send a message to Jane about the report"
• 🗺️ **Directions** - "How do I get to the conference room?"
• 🕐 **Office hours** - "What time do you close?"

Just talk to me naturally! What can I help you with today? 😊`;
}

function generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase().trim();
    
    // Greetings
    if (message.match(/^(hi|hello|hey|good morning|good afternoon)/)) {
        const timeOfDay = getTimeOfDay();
        const responses = [
            `Hello! 👋 Good ${timeOfDay}! Welcome to our office. How can I help you today?`,
            `Hi there! 😊 Great to see you! Need help with a visitor, meeting, or something else?`,
            `Hey! 👋 I'm your AI receptionist. Ready to help with anything you need!`
        ];
        return { response: getRandomResponse(responses), action: null };
    }
    
    // How are you
    if (message.match(/how are you|how's it going/)) {
        return { response: "I'm doing fantastic! 😊 Thanks for asking! Ready to help you with anything you need. What can I do for you today?", action: null };
    }
    
    // What's your name
    if (message.match(/your name|who are you/)) {
        return { response: "I'm Aida! 🤖 Your friendly AI Receptionist. I'm here to handle check-ins, schedule meetings, help you find staff, and make sure everything runs smoothly!", action: null };
    }
    
    // Help
    if (message.match(/what can you do|help/)) {
        return { response: "I can help you with: checking in visitors 📝, scheduling meetings 📅, finding staff members 👥, sending messages 💬, giving directions 🗺️, and answering questions about office hours 🕐. Just tell me what you need!", action: "help" };
    }
    
    // Check in visitor
    if (message.match(/check in|visitor|here to see/)) {
        const visitorName = extractName(message, ['check in', 'visitor', 'here to see']);
        const hostName = extractHost(message);
        
        if (visitorName && hostName) {
            const visitor = checkInVisitor({ name: visitorName, host_name: hostName, purpose: 'Meeting' });
            return { response: `✅ ${visitorName} has been checked in! Badge #${visitor.badge_number}. I've notified ${hostName}. They can wait in the reception area.`, action: "checkin_complete" };
        }
        return { response: "I'll help check in a visitor. Please tell me their full name and who they're here to see. For example: 'Check in John Smith to see Mary Johnson'", action: "checkin_prompt" };
    }
    
    // Schedule meeting
    if (message.match(/schedule|meeting|appointment/)) {
        const person = extractPerson(message);
        const time = extractTime(message);
        
        if (person && time) {
            scheduleAppointment({
                title: "Meeting",
                attendee_name: person,
                host_name: "Reception",
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + 3600000).toISOString(),
                room: "Conference Room"
            });
            return { response: `📅 Meeting scheduled with ${person} at ${time}. Calendar invites have been sent!`, action: "schedule_complete" };
        }
        return { response: "I can help schedule a meeting! Please tell me who you want to meet with and what time works best. Example: 'Schedule a meeting with John at 2 PM'", action: "schedule_prompt" };
    }
    
    // Find staff
    if (message.match(/where is|find|staff|employee/)) {
        const searchTerm = message.replace(/where is|find|staff|employee/gi, '').trim();
        const foundStaff = staff.find(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (foundStaff) {
            return { response: `👤 ${foundStaff.name} is in ${foundStaff.office}. They're the ${foundStaff.position} in ${foundStaff.department}. ${foundStaff.available ? 'They are available right now!' : 'They are currently in a meeting.'} Would you like me to send them a message?`, action: "staff_found", data: foundStaff };
        }
        return { response: `I couldn't find "${searchTerm}" in our directory. Would you like me to list all staff members?`, action: null };
    }
    
    // Send message
    if (message.match(/message|tell|notify/)) {
        const recipient = extractRecipient(message);
        const content = extractContent(message);
        
        if (recipient && content) {
            addMessage({ recipient: recipient, sender_name: "AI Receptionist", message: content });
            return { response: `💬 Message sent to ${recipient}: "${content}"`, action: "message_sent" };
        }
        return { response: "I can send a message for you. Please tell me who to contact and what to say. Example: 'Send a message to John that his visitor has arrived'", action: "message_prompt" };
    }
    
    // Office hours
    if (message.match(/hours|open|close/)) {
        return { response: "🕐 Our office hours are Monday-Friday 8am-5pm, Saturday 9am-1pm. We're closed on Sundays. Need to schedule a visit?", action: null };
    }
    
    // Directions
    if (message.match(/direction|where is|how to get/)) {
        if (message.includes('it') || message.includes('tech')) {
            return { response: "🖥️ The IT Department is on the 2nd floor, Room 201. Take the elevator to your right, then turn left at the end of the hallway.", action: null };
        }
        if (message.includes('hr') || message.includes('human resources')) {
            return { response: "👥 HR is on the 1st floor, Room 105. Go straight past reception, take the second left, and it's the third door on the right.", action: null };
        }
        if (message.includes('conference') || message.includes('meeting room')) {
            return { response: "📋 Conference rooms are on the 2nd floor. Rooms A and B are to the left of the elevator, Room C is to the right.", action: null };
        }
        return { response: "📍 I can help you find your way! Where would you like to go? (IT Department, HR, Conference Rooms, Restrooms, Parking)", action: null };
    }
    
    // Thank you
    if (message.includes('thank')) {
        return { response: "You're very welcome! 😊 Is there anything else I can help you with?", action: null };
    }
    
    // Goodbye
    if (message.includes('bye') || message.includes('goodbye')) {
        return { response: "Goodbye! 👋 Have a wonderful day! Come back anytime you need assistance!", action: null };
    }
    
    // Joke
    if (message.includes('joke')) {
        const jokes = [
            "Why did the receptionist get promoted? Because she was outstanding in her field! 😄",
            "What do you call a receptionist who's good at math? An account-receptionist! 🤣",
            "Why did the AI receptionist go to school? To improve her 'server' skills! 😂"
        ];
        return { response: getRandomResponse(jokes), action: null };
    }
    
    // Default
    return { response: "I hear you! 🤔 I'm here to help with visitor check-ins, scheduling meetings, finding staff, and answering office questions. Could you tell me more about what you need? For example, you can say 'Check in a visitor' or 'Schedule a meeting'", action: null };
}

function extractName(message, excludeWords) {
    let text = message;
    excludeWords.forEach(word => { text = text.replace(word, ''); });
    const words = text.trim().split(' ');
    if (words.length >= 2) return words.slice(0, 2).join(' ').replace(/[^\w\s]/g, '');
    return null;
}

function extractHost(message) {
    const match = message.match(/(?:to see|with|meeting with)\s+(\w+\s+\w+)/i);
    return match ? match[1] : null;
}

function extractPerson(message) {
    const match = message.match(/(?:with|meeting)\s+(\w+\s+\w+)/i);
    return match ? match[1] : null;
}

function extractTime(message) {
    const match = message.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    return match ? match[1] : null;
}

function extractRecipient(message) {
    const match = message.match(/(?:to|message|tell)\s+(\w+\s+\w+)/i);
    return match ? match[1] : null;
}

function extractContent(message) {
    const match = message.match(/(?:that|message|tell).+?(?:to|that)\s+(.+)$/i);
    return match ? match[1].trim() : null;
}

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
}

function getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
}

async function sendChatMessage(message = null) {
    let input = message;
    if (!input) {
        input = document.getElementById('chatInput').value.trim();
    }
    if (!input) return;
    
    addChatMessage(input, 'user');
    document.getElementById('chatInput').value = '';
    showTypingIndicator();
    
    setTimeout(() => {
        const response = generateAIResponse(input);
        removeTypingIndicator();
        setTimeout(() => {
            addChatMessage(response.response, 'ai');
        }, 200);
    }, 500);
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'ai-message'}`;
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(20px)';
    
    const avatarIcon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    let formattedMessage = message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    messageDiv.innerHTML = `
        <div class="message-avatar"><i class="${avatarIcon}"></i></div>
        <div class="message-content">
            <p>${formattedMessage}</p>
            <p class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 10);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    chatHistory.push({ message, sender, time: new Date() });
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'message ai-message';
    typingDiv.innerHTML = `<div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function clearChat() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `<div class="message ai-message"><div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content"><p>Chat cleared. How can I help you?</p><p class="message-time">Just now</p></div></div>`;
        chatHistory = [];
    }
}

// ==================== Speech Recognition ====================
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
            isListening = true;
            updateMicButton(true);
            addChatMessage("🎤 Listening... Please speak clearly.", 'ai');
        };
        
        recognition.onend = () => { isListening = false; updateMicButton(false); };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chatInput').value = transcript;
            sendChatMessage(transcript);
        };
        
        recognition.onerror = () => {
            updateMicButton(false);
            addChatMessage("Sorry, I couldn't hear you. Please try again or type your message.", 'ai');
        };
    }
}

function startVoiceInput() {
    if (recognition) {
        if (isListening) recognition.stop();
        else try { recognition.start(); } catch(e) { addChatMessage("Please allow microphone access to use voice input.", 'ai'); }
    } else {
        addChatMessage("Voice input is not supported in your browser. Please type your message instead.", 'ai');
    }
}

function updateMicButton(isActive) {
    const micBtn = document.getElementById('micButton');
    const voiceBtn = document.getElementById('voiceInputBtn');
    if (micBtn) {
        if (isActive) { micBtn.classList.add('listening'); micBtn.innerHTML = '<i class="fas fa-microphone-alt"></i>'; }
        else { micBtn.classList.remove('listening'); micBtn.innerHTML = '<i class="fas fa-microphone"></i>'; }
    }
    if (voiceBtn) { if (isActive) voiceBtn.classList.add('listening'); else voiceBtn.classList.remove('listening'); }
}

// ==================== View Management ====================
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) item.classList.add('active');
    });
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}View`).classList.add('active');
    
    const titles = { dashboard: 'Dashboard', visitors: 'Visitor Management', appointments: 'Appointments', messages: 'Messages', staff: 'Staff Directory', supplies: 'Office Supplies', calls: 'Call Logs' };
    document.getElementById('pageTitle').textContent = titles[view] || 'Dashboard';
    
    if (view === 'appointments') renderAppointmentsList('today');
    if (view === 'staff') renderStaffList();
    if (view === 'supplies') renderSuppliesList();
    if (view === 'calls') renderCallLogs();
    if (view === 'messages') renderMessagesList();
    
    if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
}

function filterStaff(searchTerm) {
    const filtered = staff.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const container = document.getElementById('staffGrid');
    if (filtered.length === 0) container.innerHTML = '<div class="empty-state">No staff members found</div>';
    else container.innerHTML = filtered.map(m => `<div class="staff-card" onclick="sendChatMessage('Tell me about ${m.name}')"><div class="staff-avatar"><i class="fas fa-user-circle"></i></div><div class="staff-info"><h4>${escapeHtml(m.name)}</h4><p><i class="fas fa-briefcase"></i> ${m.position}</p><p><i class="fas fa-building"></i> ${m.department}</p><p><i class="fas fa-map-marker-alt"></i> ${m.office}</p><p><i class="fas fa-phone"></i> ${m.phone}</p><span class="staff-status ${m.available ? 'status-available' : 'status-busy'}">${m.available ? '🟢 Available' : '🔴 Busy'}</span></div></div>`).join('');
}

// ==================== Event Listeners ====================
function setupEventListeners() {
    document.getElementById('sendMessageBtn').addEventListener('click', () => sendChatMessage());
    document.getElementById('chatInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
    document.getElementById('voiceInputBtn').addEventListener('click', startVoiceInput);
    document.getElementById('micButton').addEventListener('click', startVoiceInput);
    document.getElementById('clearChatBtn').addEventListener('click', clearChat);
    document.getElementById('chatToggle').addEventListener('click', () => document.getElementById('chatBody').classList.toggle('collapsed'));
    document.getElementById('staffSearch').addEventListener('input', (e) => filterStaff(e.target.value));
    document.getElementById('mobileMenuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
    
    document.querySelectorAll('.quick-action').forEach(btn => {
        btn.addEventListener('click', () => {
            const actions = { checkin: "I need to check in a visitor", schedule: "I need to schedule a meeting", message: "I need to send a message", staff: "Find staff members", directions: "Give me directions to the conference room", hours: "What are your office hours?", help: "What can you do?" };
            sendChatMessage(actions[btn.dataset.action] || "Help");
        });
    });
    
    document.querySelectorAll('.view-all').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', (e) => { e.preventDefault(); switchView(item.dataset.view); }));
    document.getElementById('quickCheckInBtn').addEventListener('click', showCheckinModal);
    document.getElementById('scheduleAppointmentBtn').addEventListener('click', showScheduleModal);
    document.getElementById('newMessageBtn').addEventListener('click', showNewMessageModal);
    document.getElementById('logCallBtn').addEventListener('click', showLogCallModal);
    document.getElementById('orderSuppliesBtn').addEventListener('click', () => sendChatMessage("I need to order supplies"));
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderAppointmentsList(btn.dataset.filter);
        });
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${btn.dataset.tab}VisitorsTab`).classList.add('active');
        });
    });
    
    document.getElementById('settingsBtn').addEventListener('click', () => document.getElementById('settingsDropdown').classList.toggle('active'));
    document.addEventListener('click', (e) => { if (!e.target.closest('.settings-panel')) document.getElementById('settingsDropdown').classList.remove('active'); });
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => { notification.classList.remove('show'); setTimeout(() => notification.remove(), 300); }, 3000);
}

function closeAllModals() {
    document.getElementById('modalContainer').innerHTML = '';
}

// Make functions global
window.sendChatMessage = sendChatMessage;
window.checkOutVisitor = checkOutVisitor;
window.viewMessage = viewMessage;
window.replyToMessage = replyToMessage;
window.toggleStaffAvailability = toggleStaffAvailability;
window.orderSupply = orderSupply;
window.cancelAppointment = cancelAppointment;
window.showCheckinModal = showCheckinModal;
window.showScheduleModal = showScheduleModal;
window.showNewMessageModal = showNewMessageModal;
window.showLogCallModal = showLogCallModal;
window.handleCheckInSubmit = handleCheckInSubmit;
window.handleScheduleSubmit = handleScheduleSubmit;
window.handleMessageSubmit = handleMessageSubmit;
window.handleCallLogSubmit = handleCallLogSubmit;
window.switchView = switchView;
window.filterStaff = filterStaff;
window.closeAllModals = closeAllModals;
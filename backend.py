"""
AI Receptionist System - Flask Backend
Complete API with SQLite database (auto-created)
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime, timedelta
import sqlite3
import json
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Database path - auto creates in same folder
DB_PATH = Path(__file__).parent / "visitors.db"

# ==================== Database Functions ====================

def get_db_connection():
    """Create and return database connection"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

def init_database():
    """Initialize database tables if they don't exist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Visitors table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            company TEXT,
            host_name TEXT NOT NULL,
            host_email TEXT,
            purpose TEXT,
            check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            check_out_time TIMESTAMP,
            badge_number TEXT,
            status TEXT DEFAULT 'checked_in'
        )
    ''')
    
    # Appointments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            attendee_name TEXT,
            attendee_email TEXT,
            host_name TEXT,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP,
            location TEXT,
            room TEXT,
            status TEXT DEFAULT 'scheduled',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient TEXT NOT NULL,
            recipient_email TEXT,
            sender_name TEXT,
            message TEXT NOT NULL,
            priority TEXT DEFAULT 'normal',
            status TEXT DEFAULT 'unread',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Staff table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            department TEXT,
            position TEXT,
            phone TEXT,
            office_location TEXT,
            extension TEXT,
            is_available BOOLEAN DEFAULT 1
        )
    ''')
    
    # Supplies table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS supplies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            unit TEXT,
            min_threshold INTEGER DEFAULT 5,
            last_ordered TIMESTAMP
        )
    ''')
    
    # Call logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS call_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            caller_name TEXT,
            caller_phone TEXT,
            recipient TEXT,
            duration INTEGER,
            notes TEXT,
            call_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    
    # Insert sample data if tables are empty
    cursor.execute("SELECT COUNT(*) FROM staff")
    if cursor.fetchone()[0] == 0:
        sample_staff = [
            ("Dr. John Mwangi", "john.mwangi@company.com", "Information Technology", "IT Director", "+254712345678", "Room 201, 2nd Floor", "201", 1),
            ("Jane Wanjiku", "jane.wanjiku@company.com", "Human Resources", "HR Manager", "+254723456789", "Room 105, 1st Floor", "105", 1),
            ("Peter Omondi", "peter.omondi@company.com", "Sales & Marketing", "Sales Director", "+254734567890", "Room 301, 3rd Floor", "301", 1),
            ("Mary Wambui", "mary.wambui@company.com", "Finance", "Finance Controller", "+254745678901", "Room 108, 1st Floor", "108", 1),
            ("James Kariuki", "james.kariuki@company.com", "Operations", "Operations Manager", "+254756789012", "Room 205, 2nd Floor", "205", 1),
            ("Sarah Kimani", "sarah.kimani@company.com", "Customer Support", "Support Lead", "+254767890123", "Room 110, 1st Floor", "110", 1),
            ("Michael Otieno", "michael.otieno@company.com", "Research & Development", "R&D Lead", "+254778901234", "Room 401, 4th Floor", "401", 1)
        ]
        cursor.executemany('''
            INSERT INTO staff (name, email, department, position, phone, office_location, extension, is_available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_staff)
    
    cursor.execute("SELECT COUNT(*) FROM supplies")
    if cursor.fetchone()[0] == 0:
        sample_supplies = [
            ("A4 Paper", 20, "reams", 5, None),
            ("Pens", 50, "pieces", 10, None),
            ("Notepads", 30, "pieces", 10, None),
            ("Staplers", 5, "pieces", 2, None),
            ("Printer Ink - Black", 2, "cartridges", 3, None),
            ("Printer Ink - Color", 1, "cartridges", 3, None),
            ("Batteries AA", 40, "pieces", 10, None),
            ("Envelopes", 100, "pieces", 20, None)
        ]
        cursor.executemany('''
            INSERT INTO supplies (item_name, quantity, unit, min_threshold, last_ordered)
            VALUES (?, ?, ?, ?, ?)
        ''', sample_supplies)
    
    conn.commit()
    conn.close()
    print(f"✅ Database initialized at {DB_PATH}")

# Initialize database when app starts
init_database()

# ==================== API Routes ====================

@app.route('/')
def index():
    """Serve the main dashboard"""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """AI chat endpoint - returns intelligent responses"""
    try:
        data = request.json
        user_message = data.get('message', '')
        
        # Simple AI response generation (can be expanded)
        response = generate_smart_response(user_message)
        
        return jsonify(response)
    except Exception as e:
        print(f"Error in chat: {e}")
        return jsonify({
            'response': "I'm having a moment. Please try again!",
            'action': None
        })

def generate_smart_response(message):
    """Generate intelligent responses based on user input"""
    msg = message.lower()
    
    # Visitor check-in
    if 'check in' in msg or 'visitor' in msg:
        return {
            'response': "I'll help you check in a visitor. Please fill out the check-in form or tell me the visitor's name and who they're here to see.",
            'action': 'checkin_prompt'
        }
    
    # Schedule meeting
    elif 'schedule' in msg or 'meeting' in msg or 'appointment' in msg:
        return {
            'response': "I can help schedule a meeting. Please tell me who you want to meet with and what time works best.",
            'action': 'schedule_prompt'
        }
    
    # Staff lookup
    elif 'where is' in msg or 'find' in msg or 'staff' in msg or 'employee' in msg:
        return {
            'response': "I can help you find staff members. Please tell me the person's name or department you're looking for.",
            'action': 'staff_prompt'
        }
    
    # Send message
    elif 'message' in msg or 'tell' in msg or 'notify' in msg:
        return {
            'response': "I'll help you send a message. Who would you like to contact and what should I tell them?",
            'action': 'message_prompt'
        }
    
    # Office hours
    elif 'hours' in msg or 'open' in msg or 'close' in msg:
        return {
            'response': "Our office hours are Monday-Friday 8:00 AM to 5:00 PM, and Saturday 9:00 AM to 1:00 PM. We're closed on Sundays.",
            'action': None
        }
    
    # Directions
    elif 'direction' in msg or 'where' in msg or 'how to get' in msg:
        return {
            'response': "I can help with directions. Where would you like to go? (Reception, IT Department, HR, Conference Rooms, Restrooms, Parking)",
            'action': None
        }
    
    # Help
    elif 'help' in msg or 'what can you do' in msg:
        return {
            'response': "I'm your AI receptionist! I can help with: checking in visitors, scheduling meetings, sending messages, finding staff, providing directions, and answering questions about office hours and company information. Just tell me what you need!",
            'action': None
        }
    
    # Greeting
    elif any(word in msg for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
        return {
            'response': "Hello! Welcome to our office. How can I assist you today?",
            'action': None
        }
    
    # Default
    else:
        return {
            'response': "I'm here to help with reception tasks. You can ask me to check in visitors, schedule meetings, find staff, or answer questions about our office. What would you like to do?",
            'action': None
        }

# ==================== Visitor Endpoints ====================

@app.route('/api/visitors', methods=['GET'])
def get_all_visitors():
    """Get all visitors"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM visitors ORDER BY check_in_time DESC")
    visitors = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(visitors)

@app.route('/api/visitors/active', methods=['GET'])
def get_active_visitors():
    """Get all checked-in visitors"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM visitors WHERE status = 'checked_in' ORDER BY check_in_time DESC")
    visitors = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(visitors)

@app.route('/api/visitors/checkin', methods=['POST'])
def checkin_visitor():
    """Check in a new visitor"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate badge number
        badge = f"V{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        cursor.execute('''
            INSERT INTO visitors (name, email, phone, company, host_name, host_email, purpose, badge_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'), data.get('email'), data.get('phone'), data.get('company'),
            data.get('host_name'), data.get('host_email'), data.get('purpose'), badge
        ))
        
        visitor_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'visitor_id': visitor_id, 'badge_number': badge})
    except Exception as e:
        print(f"Error checking in visitor: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/visitors/checkout/<int:visitor_id>', methods=['POST'])
def checkout_visitor(visitor_id):
    """Check out a visitor"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE visitors 
            SET check_out_time = CURRENT_TIMESTAMP, status = 'checked_out'
            WHERE id = ?
        ''', (visitor_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== Appointment Endpoints ====================

@app.route('/api/appointments', methods=['GET'])
def get_today_appointments():
    """Get today's appointments"""
    conn = get_db_connection()
    cursor = conn.cursor()
    today = datetime.now().strftime('%Y-%m-%d')
    cursor.execute('''
        SELECT * FROM appointments 
        WHERE DATE(start_time) = DATE(?)
        ORDER BY start_time
    ''', (today,))
    appointments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(appointments)

@app.route('/api/appointments/upcoming', methods=['GET'])
def get_upcoming_appointments():
    """Get upcoming appointments"""
    days = request.args.get('days', 7, type=int)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM appointments 
        WHERE start_time >= CURRENT_TIMESTAMP
        AND start_time <= datetime(CURRENT_TIMESTAMP, '+' || ? || ' days')
        ORDER BY start_time
    ''', (days,))
    appointments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(appointments)

@app.route('/api/appointments/schedule', methods=['POST'])
def schedule_appointment():
    """Schedule a new appointment"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO appointments (title, description, attendee_name, attendee_email, 
                                     host_name, start_time, end_time, location, room)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('title'), data.get('description'), data.get('attendee_name'), 
            data.get('attendee_email'), data.get('host_name'), data.get('start_time'),
            data.get('end_time'), data.get('location'), data.get('room')
        ))
        
        appt_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'appointment_id': appt_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== Message Endpoints ====================

@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Get all messages"""
    recipient = request.args.get('recipient')
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if recipient:
        cursor.execute('''
            SELECT * FROM messages 
            WHERE recipient = ? AND status = 'unread'
            ORDER BY created_at DESC
        ''', (recipient,))
    else:
        cursor.execute('''
            SELECT * FROM messages 
            WHERE status = 'unread'
            ORDER BY created_at DESC
        ''')
    
    messages = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(messages)

@app.route('/api/messages/send', methods=['POST'])
def send_message():
    """Send a new message"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO messages (recipient, recipient_email, sender_name, message, priority)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data.get('recipient'), data.get('recipient_email'), 
            data.get('sender_name'), data.get('message'), data.get('priority', 'normal')
        ))
        
        msg_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message_id': msg_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/messages/read/<int:message_id>', methods=['POST'])
def mark_message_read(message_id):
    """Mark a message as read"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE messages SET status = "read" WHERE id = ?', (message_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== Staff Endpoints ====================

@app.route('/api/staff', methods=['GET'])
def get_staff():
    """Get all staff members"""
    department = request.args.get('department')
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if department:
        cursor.execute('''
            SELECT * FROM staff 
            WHERE department LIKE ? 
            ORDER BY name
        ''', (f'%{department}%',))
    else:
        cursor.execute('SELECT * FROM staff ORDER BY department, name')
    
    staff = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(staff)

@app.route('/api/staff/<int:staff_id>', methods=['GET'])
def get_staff_by_id(staff_id):
    """Get staff member by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM staff WHERE id = ?', (staff_id,))
    staff = cursor.fetchone()
    conn.close()
    return jsonify(dict(staff) if staff else None)

@app.route('/api/staff/availability/<int:staff_id>', methods=['PUT'])
def update_staff_availability(staff_id):
    """Update staff availability"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE staff SET is_available = ? WHERE id = ?
        ''', (data.get('is_available', True), staff_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== Supplies Endpoints ====================

@app.route('/api/supplies', methods=['GET'])
def get_supplies():
    """Get all supplies"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM supplies ORDER BY item_name')
    supplies = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(supplies)

@app.route('/api/supplies/low-stock', methods=['GET'])
def get_low_stock():
    """Get low stock items"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM supplies 
        WHERE quantity <= min_threshold
        ORDER BY quantity ASC
    ''')
    items = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(items)

@app.route('/api/supplies/update/<int:supply_id>', methods=['PUT'])
def update_supply(supply_id):
    """Update supply quantity"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE supplies SET quantity = ? WHERE id = ?
        ''', (data.get('quantity', 0), supply_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== Call Logs Endpoints ====================

@app.route('/api/calls', methods=['GET'])
def get_calls():
    """Get recent call logs"""
    limit = request.args.get('limit', 50, type=int)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM call_logs 
        ORDER BY call_time DESC 
        LIMIT ?
    ''', (limit,))
    calls = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(calls)

@app.route('/api/calls/log', methods=['POST'])
def log_call():
    """Log a new call"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO call_logs (caller_name, caller_phone, recipient, duration, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data.get('caller_name'), data.get('caller_phone'),
            data.get('recipient'), data.get('duration'), data.get('notes')
        ))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== Dashboard Stats ====================

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM visitors WHERE status = 'checked_in'")
    active_visitors = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM appointments WHERE DATE(start_time) = DATE('now')")
    today_appointments = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM messages WHERE status = 'unread'")
    unread_messages = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM supplies WHERE quantity <= min_threshold")
    low_stock = cursor.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        'active_visitors': active_visitors,
        'today_appointments': today_appointments,
        'unread_messages': unread_messages,
        'low_stock_items': low_stock
    })

# ==================== Template Context ====================

@app.context_processor
def utility_processor():
    """Make functions available to templates"""
    return dict(now=datetime.now)

# ==================== Run App ====================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🤖 AI Receptionist System")
    print("="*50)
    print(f"✅ Database: {DB_PATH}")
    print(f"📂 Templates: {Path(__file__).parent / 'templates'}")
    print("\n🌐 Server running at: http://localhost:5000")
    print("Press Ctrl+C to stop\n")
    print("="*50 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
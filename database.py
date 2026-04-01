"""
Database module for AI Receptionist System
Handles all data storage operations
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import os

class Database:
    """Database handler for the AI Receptionist system"""
    
    def __init__(self, db_path: str = "visitors.db"):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)
    
    def init_database(self):
        """Initialize all database tables"""
        conn = self.get_connection()
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
        
        # Appointments/Schedule table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                attendee_name TEXT,
                attendee_email TEXT,
                host_name TEXT,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
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
        
        # Office supplies inventory
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
        
        # Staff directory
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS staff (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                department TEXT,
                position TEXT,
                phone TEXT,
                office_location TEXT,
                is_available BOOLEAN DEFAULT 1
            )
        ''')
        
        # Call logs
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
        
        # Initialize default staff if empty
        cursor.execute("SELECT COUNT(*) FROM staff")
        if cursor.fetchone()[0] == 0:
            default_staff = [
                ("John Mwangi", "john.mwangi@company.com", "IT", "IT Manager", "0712345678", "Room 101", 1),
                ("Jane Wanjiku", "jane.wanjiku@company.com", "HR", "HR Director", "0723456789", "Room 102", 1),
                ("Peter Omondi", "peter.omondi@company.com", "Sales", "Sales Manager", "0734567890", "Room 103", 1),
                ("Mary Ndegwa", "mary.ndegwa@company.com", "Marketing", "Marketing Lead", "0745678901", "Room 104", 1),
                ("James Kariuki", "james.kariuki@company.com", "Finance", "Finance Manager", "0756789012", "Room 105", 1),
            ]
            cursor.executemany('''
                INSERT INTO staff (name, email, department, position, phone, office_location, is_available)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', default_staff)
        
        # Initialize default supplies
        cursor.execute("SELECT COUNT(*) FROM supplies")
        if cursor.fetchone()[0] == 0:
            default_supplies = [
                ("A4 Paper", 20, "reams", 5, None),
                ("Pens", 50, "pieces", 10, None),
                ("Notepads", 30, "pieces", 10, None),
                ("Stapler", 5, "pieces", 2, None),
                ("Printer Ink - Black", 8, "cartridges", 3, None),
                ("Printer Ink - Color", 6, "cartridges", 3, None),
                ("Batteries AA", 40, "pieces", 10, None),
                ("Envelopes", 100, "pieces", 20, None),
            ]
            cursor.executemany('''
                INSERT INTO supplies (item_name, quantity, unit, min_threshold, last_ordered)
                VALUES (?, ?, ?, ?, ?)
            ''', default_supplies)
        
        conn.commit()
        conn.close()
    
    # Visitor Management Methods
    def check_in_visitor(self, data: Dict) -> int:
        """Register a new visitor check-in"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Generate badge number
        badge_number = f"V{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        cursor.execute('''
            INSERT INTO visitors (name, email, phone, company, host_name, host_email, purpose, badge_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['name'], data.get('email'), data.get('phone'), data.get('company'),
            data['host_name'], data.get('host_email'), data.get('purpose'), badge_number
        ))
        
        visitor_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return visitor_id
    
    def check_out_visitor(self, visitor_id: int):
        """Record visitor check-out time"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE visitors 
            SET check_out_time = CURRENT_TIMESTAMP, status = 'checked_out'
            WHERE id = ?
        ''', (visitor_id,))
        
        conn.commit()
        conn.close()
    
    def get_active_visitors(self) -> List[Dict]:
        """Get all currently checked-in visitors"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM visitors 
            WHERE status = 'checked_in'
            ORDER BY check_in_time DESC
        ''')
        
        columns = [description[0] for description in cursor.description]
        visitors = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return visitors
    
    # Appointment Management
    def schedule_appointment(self, data: Dict) -> int:
        """Schedule a new appointment"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO appointments (title, description, attendee_name, attendee_email, 
                                     host_name, start_time, end_time, location, room)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['title'], data.get('description'), data['attendee_name'], data.get('attendee_email'),
            data['host_name'], data['start_time'], data['end_time'], data.get('location'), data.get('room')
        ))
        
        appt_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return appt_id
    
    def get_today_appointments(self) -> List[Dict]:
        """Get all appointments for today"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            SELECT * FROM appointments 
            WHERE DATE(start_time) = DATE(?)
            ORDER BY start_time
        ''', (today,))
        
        columns = [description[0] for description in cursor.description]
        appointments = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return appointments
    
    def get_upcoming_appointments(self, days: int = 7) -> List[Dict]:
        """Get upcoming appointments"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM appointments 
            WHERE start_time >= CURRENT_TIMESTAMP
            AND start_time <= datetime(CURRENT_TIMESTAMP, '+' || ? || ' days')
            ORDER BY start_time
        ''', (days,))
        
        columns = [description[0] for description in cursor.description]
        appointments = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return appointments
    
    # Message Management
    def send_message(self, data: Dict) -> int:
        """Send a message to a staff member"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO messages (recipient, recipient_email, sender_name, message, priority)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data['recipient'], data.get('recipient_email'), data['sender_name'],
            data['message'], data.get('priority', 'normal')
        ))
        
        msg_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return msg_id
    
    def get_unread_messages(self, recipient: str = None) -> List[Dict]:
        """Get unread messages"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if recipient:
            cursor.execute('''
                SELECT * FROM messages 
                WHERE status = 'unread' AND recipient = ?
                ORDER BY created_at DESC
            ''', (recipient,))
        else:
            cursor.execute('''
                SELECT * FROM messages 
                WHERE status = 'unread'
                ORDER BY created_at DESC
            ''')
        
        columns = [description[0] for description in cursor.description]
        messages = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return messages
    
    def mark_message_read(self, message_id: int):
        """Mark a message as read"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE messages SET status = 'read' WHERE id = ?
        ''', (message_id,))
        
        conn.commit()
        conn.close()
    
    # Staff Directory
    def get_all_staff(self) -> List[Dict]:
        """Get all staff members"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM staff ORDER BY department, name")
        
        columns = [description[0] for description in cursor.description]
        staff = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return staff
    
    def get_staff_by_department(self, department: str) -> List[Dict]:
        """Get staff by department"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM staff WHERE department = ? ORDER BY name", (department,))
        
        columns = [description[0] for description in cursor.description]
        staff = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return staff
    
    def update_staff_availability(self, staff_id: int, is_available: bool):
        """Update staff availability status"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE staff SET is_available = ? WHERE id = ?
        ''', (is_available, staff_id))
        
        conn.commit()
        conn.close()
    
    # Office Supplies Management
    def get_supplies(self) -> List[Dict]:
        """Get all office supplies inventory"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM supplies ORDER BY item_name")
        
        columns = [description[0] for description in cursor.description]
        supplies = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return supplies
    
    def update_supply_quantity(self, supply_id: int, quantity: int):
        """Update supply quantity"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE supplies SET quantity = ? WHERE id = ?
        ''', (quantity, supply_id))
        
        conn.commit()
        conn.close()
    
    def get_low_stock_items(self) -> List[Dict]:
        """Get items that need reordering"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM supplies 
            WHERE quantity <= min_threshold
            ORDER BY quantity ASC
        ''')
        
        columns = [description[0] for description in cursor.description]
        supplies = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return supplies
    
    # Call Logs
    def log_call(self, data: Dict):
        """Log an incoming/outgoing call"""
        conn = self.get_connection()
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
    
    def get_recent_calls(self, limit: int = 50) -> List[Dict]:
        """Get recent call logs"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM call_logs 
            ORDER BY call_time DESC 
            LIMIT ?
        ''', (limit,))
        
        columns = [description[0] for description in cursor.description]
        calls = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return calls
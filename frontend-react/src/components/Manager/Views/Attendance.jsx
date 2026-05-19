import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const parseCustomDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return null;
    
    const parts = dateStr.split(' ');
    const dateParts = parts[0].split('-');
    
    if (dateParts.length !== 3) return new Date(dateStr);
    
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    
    if (parts.length > 1) {
        const timeParts = parts[1].split(':');
        const hour = parseInt(timeParts[0], 10);
        const minute = parseInt(timeParts[1], 10);
        const second = parseInt(timeParts[2], 10) || 0;
        return new Date(year, month, day, hour, minute, second);
    }
    
    return new Date(year, month, day);
};

const Attendance = ({ currentMode }) => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const handleClockIn = async () => {
        try {
            setActionLoading(true);
            await post('/employee/attendance/clock-in/');
            alert('Clocked In successfully');
            fetchAttendance();
        } catch (err) {
            alert('Clock in failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        try {
            setActionLoading(true);
            await post('/employee/attendance/clock-out/');
            alert('Clocked Out successfully');
            fetchAttendance();
        } catch (err) {
            alert('Clock out failed');
        } finally {
            setActionLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            if (currentMode === 'manager') {
                const data = await get('/manager/attendance/');
                setAttendance(data || []);
            } else {
                const data = await get('/employee/attendance/');
                setAttendance(data || []);
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [currentMode]);

    if (currentMode === 'manager') {
        return (
            <section className="view-section active">
                <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Team Attendance</h2>
                
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading attendance records...</td></tr>
                            ) : attendance.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>No records found today</td></tr>
                            ) : (
                                attendance.map((log, index) => {
                                    const statusLower = (log.status || '').toLowerCase();
                                    return (
                                        <tr key={log.id || index}>
                                            <td style={{ fontWeight: 600 }}>{log.employee_name}</td>
                                            <td>{log.display_date || log.date || 'Today'}</td>
                                            <td>{log.check_in || '-'}</td>
                                            <td>{log.check_out || '-'}</td>
                                            <td>
                                                <span className={`status-badge ${statusLower === 'present' ? 'active' : 'expired'}`}>
                                                    {log.status || 'Present'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        );
    }

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ marginBottom: 0 }}>My Attendance</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleClockIn}
                        disabled={actionLoading}
                    >
                        <i className="fa-solid fa-clock"></i> Clock In
                    </button>
                    <button 
                        className="btn btn-ghost" 
                        onClick={handleClockOut}
                        disabled={actionLoading}
                    >
                        Clock Out
                    </button>
                </div>
            </div>
            
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading attendance history...</td></tr>
                        ) : attendance.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No attendance records found</td></tr>
                        ) : (
                            attendance.map((log, index) => {
                                const parsedDate = parseCustomDate(log.date);
                                const parsedCheckIn = parseCustomDate(log.check_in);
                                const parsedCheckOut = parseCustomDate(log.check_out);
                                const statusLower = (log.status || '').toLowerCase();
                                return (
                                    <tr key={log.id || index}>
                                        <td>{parsedDate ? parsedDate.toLocaleDateString() : '-'}</td>
                                        <td>{parsedCheckIn ? parsedCheckIn.toLocaleTimeString() : '-'}</td>
                                        <td>{parsedCheckOut ? parsedCheckOut.toLocaleTimeString() : '-'}</td>
                                        <td>
                                            <span className={`status-badge ${statusLower === 'present' ? 'active' : 'expired'}`}>
                                                {log.status || 'Present'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Attendance;

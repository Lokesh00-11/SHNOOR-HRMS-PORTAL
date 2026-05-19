import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Attendance = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const data = await get('/teamleader/attendance/');
            setLogs(data || []);
        } catch (err) {
            console.error('Error fetching team attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const handleClockIn = async () => {
        try {
            setActionLoading(true);
            await post('/employee/attendance/clock-in/');
            alert('Clocked In successfully');
            fetchAttendance();
        } catch (err) {
            alert('Clock in failed: ' + (err.message || 'Server error'));
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
            alert('Clock out failed: ' + (err.message || 'Server error'));
        } finally {
            setActionLoading(false);
        }
    };

    // Custom date & time parser to protect against "Invalid Date" errors
    const parseCustomDateTime = (dateTimeStr) => {
        if (!dateTimeStr || dateTimeStr === '-') return '-';
        // If it's already a formatted time (like HH:MM:SS / AM/PM), return it
        if (dateTimeStr.includes(':') && !dateTimeStr.includes('-') && !dateTimeStr.includes('/')) {
            return dateTimeStr;
        }
        try {
            const parts = dateTimeStr.split(' ');
            if (parts.length === 2) {
                // E.g. "DD-MM-YYYY HH:mm:ss"
                const dateParts = parts[0].split('-');
                if (dateParts.length === 3) {
                    return `${dateParts[0]}/${dateParts[1]}/${dateParts[2]} ${parts[1]}`;
                }
            }
            return dateTimeStr;
        } catch (err) {
            return dateTimeStr;
        }
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">Team & Self Attendance Log</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleClockIn}
                        disabled={actionLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
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
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Clocked In</th>
                            <th>Clocked Out</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading attendance logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No attendance logs found today.</td></tr>
                        ) : (
                            logs.map((log, index) => {
                                const isSelf = log.employee_name && log.employee_name.includes('(Me)');
                                const statusLower = (log.status || '').toLowerCase();
                                const statusClass = statusLower === 'present' ? 'active' : 'pending';
                                return (
                                    <tr key={log.id || index} style={isSelf ? { background: 'var(--primary-light)' } : {}}>
                                        <td style={{ fontWeight: 600 }}>
                                            {log.employee_name}
                                        </td>
                                        <td>{log.date || 'Today'}</td>
                                        <td>{parseCustomDateTime(log.check_in)}</td>
                                        <td>{parseCustomDateTime(log.check_out)}</td>
                                        <td>
                                            <span className={`status-badge ${statusClass}`}>
                                                {log.status}
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

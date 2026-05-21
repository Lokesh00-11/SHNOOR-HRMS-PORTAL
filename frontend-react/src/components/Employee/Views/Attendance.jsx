import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const data = await get('/employee/attendance/');
            setAttendance(data || []);
        } catch (err) {
            console.error('Error fetching attendance:', err);
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

    const getMonthlyStats = () => {
        let totalSessions = 0;
        let clockedIn = 0;
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const today = new Date();

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(currentYear, currentMonth, d);
            if (dateObj > today) continue;

            const dayStr = String(d).padStart(2, '0');
            const monthStr = String(currentMonth + 1).padStart(2, '0');
            const yearStr = String(currentYear);
            const targetDatePrefix = `${dayStr}-${monthStr}-${yearStr}`;

            const rec = attendance.find(rec => rec.date && rec.date.startsWith(targetDatePrefix));
            if (rec) {
                totalSessions++;
                if (!rec.check_out) {
                    clockedIn++;
                }
            }
        }

        return { totalSessions, clockedIn };
    };

    const stats = getMonthlyStats();

    const getSelfTileContent = ({ date, view }) => {
        if (view === 'month') {
            const d = date.getDate();
            const m = date.getMonth();
            const y = date.getFullYear();

            const dayStr = String(d).padStart(2, '0');
            const monthStr = String(m + 1).padStart(2, '0');
            const yearStr = String(y);
            const targetDatePrefix = `${dayStr}-${monthStr}-${yearStr}`;

            const rec = attendance.find(r => r.date && r.date.startsWith(targetDatePrefix));
            if (rec) {
                const checkInTime = rec.check_in ? parseCustomDate(rec.check_in) : null;
                const checkOutTime = rec.check_out ? parseCustomDate(rec.check_out) : null;

                return (
                    <div className="tile-attendance-info" style={{ display: 'flex', flexDirection: 'column', fontSize: '0.7rem', gap: '3px' }}>
                        {!rec.check_out && (
                            <span style={{
                                color: '#3b82f6',
                                fontWeight: 600,
                                fontSize: '0.65rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                padding: '0.1rem 0.3rem',
                                borderRadius: '4px',
                                alignSelf: 'flex-start',
                                marginBottom: '4px'
                            }}>
                                Clocked In
                            </span>
                        )}
                        {checkInTime && (
                            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fa-solid fa-right-to-bracket" style={{ color: '#10b981', fontSize: '0.65rem' }}></i>
                                {checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        {checkOutTime && (
                            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fa-solid fa-right-from-bracket" style={{ color: '#f43f5e', fontSize: '0.65rem' }}></i>
                                {checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                );
            }
        }
        return null;
    };

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

            {/* Attendance Monthly Dashboard Summary */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <h5 style={{ color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Total Clock Ins / Outs</h5>
                    <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0.25rem 0 0 0' }}>
                        {loading ? '...' : stats.totalSessions}
                    </h2>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <h5 style={{ color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Active Sessions (Clocked In)</h5>
                    <h2 style={{ fontSize: '2rem', color: '#3b82f6', margin: '0.25rem 0 0 0' }}>
                        {loading ? '...' : stats.clockedIn}
                    </h2>
                </div>
            </div>

            {/* Calendar Component Wrapper */}
            <div className="custom-calendar-card self-calendar">
                {loading && attendance.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                        <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}></i>
                        <p>Loading calendar...</p>
                    </div>
                ) : (
                    <Calendar
                        value={currentDate}
                        onActiveStartDateChange={({ activeStartDate }) => {
                            if (activeStartDate) setCurrentDate(activeStartDate);
                        }}
                        tileContent={getSelfTileContent}
                    />
                )}
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
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : attendance.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No records found</td></tr>
                        ) : (
                            attendance.map((rec, index) => {
                                const parsedDate = parseCustomDate(rec.date);
                                const parsedCheckIn = parseCustomDate(rec.check_in);
                                const parsedCheckOut = parseCustomDate(rec.check_out);
                                return (
                                    <tr key={index}>
                                        <td>{parsedDate ? parsedDate.toLocaleDateString() : '-'}</td>
                                        <td>{parsedCheckIn ? parsedCheckIn.toLocaleTimeString() : '-'}</td>
                                        <td>{parsedCheckOut ? parsedCheckOut.toLocaleTimeString() : '-'}</td>
                                        <td>
                                            <span className={`status-badge ${rec.check_out ? 'active' : 'pending'}`}>
                                                {rec.check_out ? 'Present' : 'Clocked In'}
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

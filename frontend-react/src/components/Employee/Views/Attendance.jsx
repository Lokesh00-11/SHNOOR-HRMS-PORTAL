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

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

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

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">My Attendance</h2>
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

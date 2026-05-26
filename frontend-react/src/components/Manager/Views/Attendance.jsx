import React, { useState, useEffect } from 'react';
import { get, post, put } from '../../../services/api';
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

const Attendance = ({ currentMode }) => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [teamEmployees, setTeamEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [timingFilter, setTimingFilter] = useState('all');
    const [formData, setFormData] = useState({
        attendance_id: '',
        employee_id: '',
        employee_name: '',
        date: '',
        check_in: '',
        check_out: ''
    });

    const convertToYYYYMMDD = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    };

    const convertTo24HourFormat = (time12) => {
        if (!time12 || time12 === '-' || time12 === 'Still In') return '';
        const parts = time12.split(' ');
        if (parts.length !== 2) return '';
        const [hoursStr, minutesStr] = parts[0].split(':');
        let hours = parseInt(hoursStr, 10);
        const ampm = parts[1].toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${minutesStr}`;
    };

    const convertTo12HourFormat = (time24) => {
        if (!time24) return '';
        const [hoursStr, minutesStr] = time24.split(':');
        let hours = parseInt(hoursStr, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursFormatted = String(hours).padStart(2, '0');
        return `${hoursFormatted}:${minutesStr} ${ampm}`;
    };

    const isLate = (checkInTime12h) => {
        if (!checkInTime12h || checkInTime12h === '-' || checkInTime12h === 'Still In') return false;
        const time24 = convertTo24HourFormat(checkInTime12h);
        if (!time24) return false;
        return time24 > '10:10';
    };

    const fetchTeamEmployees = async () => {
        try {
            const data = await get('/manager/employees/');
            setTeamEmployees(data || []);
        } catch (err) {
            console.error('Error fetching team employees:', err);
        }
    };

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
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
                const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
                const data = await get(`/manager/attendance/?start_date=${firstDay}&end_date=${lastDay}`);
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
        setSelectedDate(null);
        fetchAttendance();
        if (currentMode === 'manager') {
            fetchTeamEmployees();
        }
    }, [currentMode, currentDate]);

    useEffect(() => {
        if (teamEmployees.length > 0 && !formData.employee_id && !editingRecord) {
            setFormData(prev => ({
                ...prev,
                employee_id: teamEmployees[0].id
            }));
        }
    }, [teamEmployees]);

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


    const handleDateClick = (date) => {
        const d = date.getDate();
        const m = date.getMonth();
        const y = date.getFullYear();
        const dayStr = String(d).padStart(2, '0');
        const monthStr = String(m + 1).padStart(2, '0');
        const yearStr = String(y);
        const targetDate = `${dayStr}-${monthStr}-${yearStr}`;

        if (selectedDate === targetDate) {
            setSelectedDate(null);
        } else {
            setSelectedDate(targetDate);
        }
    };

    const getTileContent = ({ date, view }) => {
        if (view === 'month') {
            const d = date.getDate();
            const m = date.getMonth();
            const y = date.getFullYear();

            const dayStr = String(d).padStart(2, '0');
            const monthStr = String(m + 1).padStart(2, '0');
            const yearStr = String(y);
            const targetDate = `${dayStr}-${monthStr}-${yearStr}`;

            const dailyRecords = attendance.filter(log => {
                const logDate = log.display_date || log.date;
                return logDate === targetDate && (log.status || '').toLowerCase() === 'present';
            });

            if (dailyRecords.length > 0) {
                return (
                    <div className="tile-attendance-info" style={{ display: 'flex', flexDirection: 'column', fontSize: '0.65rem', gap: '3px', width: '100%' }}>
                        <span style={{
                            color: 'var(--success-color)',
                            fontWeight: 600,
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '4px',
                            alignSelf: 'stretch',
                            textAlign: 'center',
                            marginBottom: '4px'
                        }}>
                            {dailyRecords.length} Present
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '45px', overflowY: 'auto' }}>
                            {dailyRecords.map((rec, i) => (
                                <span key={i} style={{ 
                                    color: 'var(--text-muted)', 
                                    fontSize: '0.6rem', 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis' 
                                }} title={rec.employee_name}>
                                    • {rec.employee_name}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            }
        }
        return null;
    };

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

    const handleEditClick = (log) => {
        setFormData({
            attendance_id: log.attendance_id || '',
            employee_id: log.employee_id || '',
            employee_name: log.employee_name || '',
            date: convertToYYYYMMDD(log.display_date || log.date),
            check_in: convertTo24HourFormat(log.check_in),
            check_out: convertTo24HourFormat(log.check_out)
        });
        setEditingRecord(log);
        setShowModal(true);
    };

    const handleAddClick = async () => {
        let emps = teamEmployees;
        if (teamEmployees.length === 0) {
            try {
                const data = await get('/manager/employees/');
                emps = data || [];
                setTeamEmployees(emps);
            } catch (err) {
                console.error('Error loading employees in handleAddClick:', err);
            }
        }
        const defaultDate = selectedDate ? convertToYYYYMMDD(selectedDate) : new Date().toISOString().split('T')[0];
        setFormData({
            attendance_id: '',
            employee_id: emps.length > 0 ? emps[0].id : '',
            employee_name: '',
            date: defaultDate,
            check_in: '10:00',
            check_out: '18:00'
        });
        setEditingRecord(null);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const payload = {
                attendance_id: formData.attendance_id || null,
                employee_id: formData.employee_id || null,
                date: formData.date,
                check_in: convertTo12HourFormat(formData.check_in),
                check_out: convertTo12HourFormat(formData.check_out)
            };
            await put('/manager/attendance/', payload);
            alert('Attendance updated successfully');
            setShowModal(false);
            fetchAttendance();
        } catch (err) {
            alert(err.message || 'Failed to update attendance');
        } finally {
            setActionLoading(false);
        }
    };

    if (currentMode === 'manager') {
        let filteredAttendance = selectedDate
            ? attendance.filter(log => (log.display_date || log.date) === selectedDate)
            : attendance;

        if (searchQuery.trim()) {
            filteredAttendance = filteredAttendance.filter(log =>
                (log.employee_name || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
            );
        }

        if (timingFilter === 'late') {
            filteredAttendance = filteredAttendance.filter(log => isLate(log.check_in));
        } else if (timingFilter === 'on-time') {
            filteredAttendance = filteredAttendance.filter(log => log.check_in && !isLate(log.check_in));
        }

        return (
            <section className="view-section active">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="gradient-text" style={{ marginBottom: 0 }}>Team Attendance</h2>
                    <button 
                        className="btn btn-primary"
                        onClick={handleAddClick}
                    >
                        <i className="fa-solid fa-plus"></i> Add Attendance
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ position: 'relative' }}>
                            <i className="fa-solid fa-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                            <input
                                type="text"
                                placeholder="Search employee by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-control"
                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>
                    <div style={{ minWidth: '200px' }}>
                        <select
                            value={timingFilter}
                            onChange={(e) => setTimingFilter(e.target.value)}
                            className="form-control"
                            style={{ width: '100%' }}
                        >
                            <option value="all">All Employees</option>
                            <option value="on-time">On Time</option>
                            <option value="late">Late</option>
                        </select>
                    </div>
                </div>

                {/* Calendar Component Wrapper */}
                <div className="custom-calendar-card team-calendar">
                    {loading && attendance.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                            <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}></i>
                            <p>Loading calendar...</p>
                        </div>
                    ) : (
                        <Calendar
                            value={currentDate}
                            onClickDay={handleDateClick}
                            onActiveStartDateChange={({ activeStartDate }) => {
                                if (activeStartDate) {
                                    setCurrentDate(activeStartDate);
                                    setSelectedDate(null);
                                }
                            }}
                            tileContent={getTileContent}
                        />
                    )}
                </div>

                {selectedDate && (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        background: 'var(--primary-light)', 
                        border: '1px solid var(--border-subtle)', 
                        padding: '0.75rem 1.5rem', 
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        color: 'var(--primary-color)',
                        fontWeight: 600
                    }}>
                        <span>Showing records for date: {selectedDate}</span>
                        <button 
                            className="btn btn-ghost" 
                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} 
                            onClick={() => setSelectedDate(null)}
                        >
                            Show All Days
                        </button>
                    </div>
                )}

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading attendance records...</td></tr>
                            ) : filteredAttendance.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No records found for the selected view</td></tr>
                            ) : (
                                filteredAttendance.map((log, index) => {
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
                                            <td>
                                                <button 
                                                    className="btn btn-ghost"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}
                                                    onClick={() => handleEditClick(log)}
                                                >
                                                    <i className="fa-solid fa-edit"></i> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Edit/Add Attendance Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>{editingRecord ? 'Edit Attendance' : 'Add Attendance Record'}</h3>
                                <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="form-group">
                                    <label>Employee Name</label>
                                    {editingRecord ? (
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={formData.employee_name} 
                                            disabled 
                                        />
                                    ) : (
                                        <select 
                                            className="form-control"
                                            value={formData.employee_id}
                                            onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Employee...</option>
                                            {teamEmployees.map((emp) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {`${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Date</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        value={formData.date} 
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        disabled={!!editingRecord}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Check In Time</label>
                                    <input 
                                        type="time" 
                                        className="form-control" 
                                        value={formData.check_in} 
                                        onChange={(e) => setFormData({...formData, check_in: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Check Out Time</label>
                                    <input 
                                        type="time" 
                                        className="form-control" 
                                        value={formData.check_out} 
                                        onChange={(e) => setFormData({...formData, check_out: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-ghost" 
                                        onClick={() => setShowModal(false)}
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </section>
        );
    }

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ marginBottom: 0 }}>My Attendance</h2>
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

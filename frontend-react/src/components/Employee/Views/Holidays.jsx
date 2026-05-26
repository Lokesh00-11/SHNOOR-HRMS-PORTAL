import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Holidays = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedMonth, setExpandedMonth] = useState(null);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const data = await get('/employee/holidays/');
            setHolidays(data || []);
        } catch (err) {
            console.error('Error fetching holidays:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const toggleMonth = (month) => {
        setExpandedMonth(expandedMonth === month ? null : month);
    };

    // Helper to get days in month
    const getDaysInMonth = (year, monthIndex) => {
        const date = new Date(year, monthIndex, 1);
        const days = [];
        const firstDay = date.getDay();
        
        // Add empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) days.push(null);
        
        const lastDay = new Date(year, monthIndex + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) days.push(i);
        
        return days;
    };

    const parseDateStr = (dateStr) => {
        if (!dateStr) return new Date();
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length !== 4) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        return new Date(dateStr);
    };

    const isHoliday = (monthIndex, day) => {
        if (!day) return null;
        const holiday = holidays.find(h => {
            const hDate = parseDateStr(h.date);
            return hDate.getMonth() === monthIndex && hDate.getDate() === day;
        });
        return holiday;
    };

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Company Holidays</h2>

            <div className="table-container" style={{ marginBottom: '2rem' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Holiday Name</th>
                            <th>Date</th>
                            <th>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>Loading holidays...</td></tr>
                        ) : holidays.length === 0 ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>No holidays listed.</td></tr>
                        ) : holidays.map(h => (
                            <tr key={h.id}>
                                <td><strong>{h.name}</strong></td>
                                <td>{h.date}</td>
                                <td>{h.type || 'Public Holiday'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--text-main)' }}>Year 2026 Calendar</h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f1f5f9', border: '1px solid var(--border-subtle)' }}></div> Weekend
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#dcfce7', border: '1px solid #bbf7d0' }}></div> Holiday
                        </span>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {months.map((month, idx) => (
                        <div key={month} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <div 
                                onClick={() => toggleMonth(month)}
                                style={{ padding: '1rem', cursor: 'pointer', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', background: expandedMonth === month ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                            >
                                <span style={{ fontWeight: 600, color: expandedMonth === month ? 'var(--primary-color)' : 'var(--text-main)' }}>{month} 2026</span>
                                <i className={`fa-solid fa-chevron-${expandedMonth === month ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)' }}></i>
                            </div>
                            
                            {expandedMonth === month && (
                                <div style={{ padding: '1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                            <div key={d} style={{ fontWeight: 600, color: 'var(--text-muted)', paddingBottom: '0.5rem', fontSize: '0.8rem' }}>{d}</div>
                                        ))}
                                        {getDaysInMonth(2026, idx).map((day, dIdx) => {
                                            const holiday = isHoliday(idx, day);
                                            const isWeekend = day && (new Date(2026, idx, day).getDay() === 0 || new Date(2026, idx, day).getDay() === 6);
                                            
                                            return (
                                                <div 
                                                    key={dIdx} 
                                                    title={holiday ? holiday.name : isWeekend ? 'Weekend' : ''}
                                                    style={{ 
                                                        padding: '0.75rem 0', 
                                                        borderRadius: '8px', 
                                                        fontSize: '0.9rem',
                                                        background: holiday ? '#dcfce7' : isWeekend ? '#f1f5f9' : '#fff',
                                                        color: holiday ? '#16a34a' : isWeekend ? 'var(--text-muted)' : 'var(--text-main)',
                                                        fontWeight: holiday ? 'bold' : 'normal',
                                                        border: holiday ? '1px solid #bbf7d0' : isWeekend ? '1px solid var(--border-subtle)' : '1px solid #f1f5f9'
                                                    }}
                                                >
                                                    {day}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Holidays;

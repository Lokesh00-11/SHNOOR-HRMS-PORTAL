import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [todayAttendance, setTodayAttendance] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [appreciations, setAppreciations] = useState([]);
    const [offboardings, setOffboardings] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsData, todayData, holidaysData, expensesData, profileData, tasksData, appData, offData] = await Promise.all([
                    get('/employee/stats/'),
                    get('/employee/attendance/today/'),
                    get('/employee/holidays/'),
                    get('/employee/expenses/'),
                    get('/employee/profile/'),
                    get('/employee/tasks/').catch(() => []),
                    get('/employee/appreciations/self/').catch(() => []),
                    get('/employee/offboardings/').catch(() => [])
                ]);
                
                setStats(statsData);
                setTodayAttendance(todayData || []);
                setHolidays(holidaysData || []);
                setExpenses(expensesData || []);
                setProfile(profileData || null);
                setTasks(tasksData || []);
                setAppreciations(appData || []);
                setOffboardings(offData || []);
            } catch (err) {
                console.error('Error fetching employee dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getStatusText = () => {
        if (!todayAttendance || todayAttendance.length === 0) return { text: 'Not Clocked In', color: '#f59e0b' };
        const lastRec = todayAttendance[todayAttendance.length - 1];
        if (!lastRec.check_out) return { text: 'Clocked In', color: '#10b981' };
        return { text: 'Clocked Out', color: 'var(--primary-color)' };
    };

    const parseDate = (dStr) => {
        if (!dStr) return '';
        const parts = dStr.split('-');
        if (parts.length === 3 && parts[0].length === 2) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return dStr;
    };

    const nextHoliday = holidays.length > 0 
        ? holidays
            .filter(h => {
                const today = new Date();
                const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
                return parseDate(h.date) >= todayStr;
            })
            .sort((a, b) => parseDate(a.date).localeCompare(parseDate(b.date)))[0]
        : null;
    const status = getStatusText();
    const pendingExpenses = expenses.filter(e => e.status?.toLowerCase() === 'pending');
    const totalPendingAmount = pendingExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const firstClockIn = todayAttendance && todayAttendance.length > 0 && todayAttendance[0].check_in ? new Date(todayAttendance[0].check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
    const lastClockOut = todayAttendance && todayAttendance.length > 0 && todayAttendance[todayAttendance.length - 1].check_out ? new Date(todayAttendance[todayAttendance.length - 1].check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
    const overdueTasksCount = tasks.filter(t => t.status !== 'Completed' && new Date(t.deadline) < new Date()).length;
    const totalAppreciations = appreciations.length;
    const totalOffboardings = offboardings.length;

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Dashboard</h2>
            
            {/* Employee Profile Card */}
            {profile && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flexShrink: 0 }}>
                        {profile.profile_picture ? (
                            <img 
                                src={profile.profile_picture} 
                                alt="Profile" 
                                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)' }}
                            />
                        ) : (
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem', fontWeight: 'bold' }}>
                                {(profile.full_name || profile.username || 'E')[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
                            {profile.full_name || profile.username}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                            {profile.designation || 'Employee'} • {profile.department || 'General'}
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee ID</strong>
                                <span>{profile.employee_id || 'N/A'}</span>
                            </div>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Work Mode</strong>
                                <span>{profile.work_mode || 'Office'}</span>
                            </div>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Number</strong>
                                <span>{profile.phone_number || 'N/A'}</span>
                            </div>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aadhaar Number</strong>
                                <span>{profile.aadhaar_number || 'N/A'}</span>
                            </div>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PAN Number</strong>
                                <span>{profile.pan_number || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="dashboard-grid">
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Status Today</h4>
                    <h1 style={{ fontSize: '2rem', marginTop: '0.5rem', color: status.color }}>
                        {loading ? '...' : status.text}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Clock In Time</h4>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginTop: '0.5rem' }}>
                        {loading ? '...' : firstClockIn}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Clock Out Time</h4>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-color)', marginTop: '0.5rem' }}>
                        {loading ? '...' : lastClockOut}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Leave Balance (Free)</h4>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginTop: '0.5rem' }}>
                        {loading ? '...' : `${stats?.total_balance || 0} Days`}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Next Holiday</h4>
                    <h1 style={{ fontSize: '2rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                        {loading ? '...' : (nextHoliday ? nextHoliday.name : 'No upcoming')}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Tasks</h4>
                    <h1 style={{ fontSize: '2rem', color: '#10b981', marginTop: '0.5rem' }}>
                        {loading ? '...' : (stats?.pending_tasks || tasks.length || 0)}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Overdue Tasks</h4>
                    <h1 style={{ fontSize: '2rem', color: '#f43f5e', marginTop: '0.5rem' }}>
                        {loading ? '...' : overdueTasksCount}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Appreciations</h4>
                    <h1 style={{ fontSize: '2rem', color: '#8b5cf6', marginTop: '0.5rem' }}>
                        {loading ? '...' : totalAppreciations}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Warnings/Action</h4>
                    <h1 style={{ fontSize: '2rem', color: '#f97316', marginTop: '0.5rem' }}>
                        {loading ? '...' : totalOffboardings}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Pending Expenses</h4>
                    <h1 style={{ fontSize: '2rem', color: '#f43f5e', marginTop: '0.5rem' }}>
                        {loading ? '...' : `₹${totalPendingAmount.toFixed(2)}`}
                    </h1>
                </div>
            </div>

        </section>
    );
};

export default Dashboard;

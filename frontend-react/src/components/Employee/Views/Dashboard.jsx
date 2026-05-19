import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [todayAttendance, setTodayAttendance] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsData, todayData, holidaysData, expensesData] = await Promise.all([
                    get('/employee/stats/'),
                    get('/employee/attendance/today/'),
                    get('/employee/holidays/'),
                    get('/employee/expenses/')
                ]);
                
                setStats(statsData);
                setTodayAttendance(todayData || []);
                setHolidays(holidaysData || []);
                setExpenses(expensesData || []);
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

    const nextHoliday = holidays.length > 0 ? holidays.filter(h => new Date(h.date) >= new Date())[0] : null;
    const status = getStatusText();
    const pendingExpenses = expenses.filter(e => e.status?.toLowerCase() === 'pending');
    const totalPendingAmount = pendingExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Dashboard</h2>
            
            <div className="dashboard-grid">
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Status Today</h4>
                    <h1 style={{ fontSize: '2rem', marginTop: '0.5rem', color: status.color }}>
                        {loading ? '...' : status.text}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Leave Balance</h4>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginTop: '0.5rem' }}>
                        {loading ? '...' : `${stats?.total_leaves || 0} Days`}
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
                        {loading ? '...' : (stats?.pending_tasks || 0)}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Pending Expenses</h4>
                    <h1 style={{ fontSize: '2rem', color: '#f43f5e', marginTop: '0.5rem' }}>
                        {loading ? '...' : `₹${totalPendingAmount.toFixed(2)}`}
                    </h1>
                </div>
            </div>

            {/* Quick Actions or Recent Activity could go here */}
        </section>
    );
};

export default Dashboard;

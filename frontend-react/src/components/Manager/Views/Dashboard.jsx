import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Dashboard = ({ currentMode }) => {
    const [stats, setStats] = useState({
        totalTeam: 0,
        presentToday: 0,
        onLeave: 0,
        pendingLeaves: 0
    });
    const [selfStats, setSelfStats] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);
            const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

            if (currentMode === 'manager') {
                const [employees, attendance, leaves] = await Promise.all([
                    get('/manager/employees/'),
                    get('/manager/attendance/'),
                    get('/manager/leaves/')
                ]);

                const present = (attendance || []).filter(a => a.date === today && a.status === 'Present').length;
                const activeLeaves = (leaves || []).filter(l => {
                    const status = (l.status || '').toLowerCase();
                    return status === 'approved' && today >= l.start_date && today <= l.end_date;
                }).length;
                const pending = (leaves || []).filter(l => (l.status || '').toLowerCase() === 'pending').length;

                setStats({
                    totalTeam: (employees || []).length,
                    presentToday: present,
                    onLeave: activeLeaves,
                    pendingLeaves: pending
                });
            } else {
                const [statsData, profileData] = await Promise.all([
                    get('/employee/stats/'),
                    get('/manager/profile/')
                ]);

                setSelfStats(statsData);
                setProfile(profileData);
            }
        } catch (err) {
            console.error('Error fetching dashboard statistics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentMode]);

    if (currentMode === 'manager') {
        return (
            <section className="view-section active">
                <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Team Dashboard</h2>
                <div className="dashboard-grid">
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Team Members</h4>
                        <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>
                            {loading ? '...' : stats.totalTeam}
                        </h1>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Present Today</h4>
                        <h1 style={{ fontSize: '2.5rem', color: '#10b981', marginTop: '0.5rem' }}>
                            {loading ? '...' : stats.presentToday}
                        </h1>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>On Leave</h4>
                        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary-color)', marginTop: '0.5rem' }}>
                            {loading ? '...' : stats.onLeave}
                        </h1>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Pending Leaves</h4>
                        <h1 style={{ fontSize: '2.5rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                            {loading ? '...' : stats.pendingLeaves}
                        </h1>
                    </div>
                </div>
                

            </section>
        );
    }

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Dashboard</h2>
            
            {profile && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%', 
                        background: 'var(--primary-color)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white', 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold'
                    }}>
                        {((profile.first_name || profile.email || 'M')[0]).toUpperCase()}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 600 }}>
                            {`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email.split('@')[0]}
                        </h3>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {profile.designation || 'Manager'} • {profile.email}
                        </p>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Leave Balance</h4>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginTop: '0.5rem' }}>
                        {loading ? '...' : `${selfStats?.total_leaves || 0} Days`}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Pending Tasks</h4>
                    <h1 style={{ fontSize: '2rem', color: '#10b981', marginTop: '0.5rem' }}>
                        {loading ? '...' : (selfStats?.pending_tasks || 0)}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Appreciations</h4>
                    <h1 style={{ fontSize: '2rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                        {loading ? '...' : (selfStats?.appreciations_count || 0)}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Active Warnings</h4>
                    <h1 style={{ fontSize: '2rem', color: '#f43f5e', marginTop: '0.5rem' }}>
                        {loading ? '...' : (selfStats?.warnings_count || 0)}
                    </h1>
                </div>
            </div>
        </section>
    );
};

export default Dashboard;

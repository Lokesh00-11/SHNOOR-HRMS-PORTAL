import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_team_members: 0,
        pending_tasks: 0,
        completed_tasks: 0,
        attendance_percentage: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await get('/teamleader/stats/');
            if (data) {
                setStats(data);
            }
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const name = localStorage.getItem('name') || 'Team Leader';
    const email = localStorage.getItem('email') || '';

    return (
        <section className="view-section active">
            {/* Header section with credentials info */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Welcome back, {name}!</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>You are logged in as a <strong>Team Leader</strong>. Control operations and track sub-members below.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Auth Account</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{email}</strong>
                    </div>
                </div>
            </div>

            {/* Metrics cards grid */}
            <div className="dashboard-grid">
                <div className="glass-panel stat-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContext: 'space-between', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <h4 style={{ color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Total Team Members</h4>
                            <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem', fontWeight: 700, margin: '0.5rem 0 0' }}>
                                {loading ? '...' : stats.total_team_members}
                            </h1>
                        </div>
                        <div className="card-icon" style={{ background: 'rgba(30, 58, 138, 0.1)', color: 'var(--primary-color)', padding: '0.75rem', borderRadius: '50%' }}>
                            <i className="fa-solid fa-users" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                    </div>
                </div>

                <div className="glass-panel stat-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContext: 'space-between', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <h4 style={{ color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Pending Tasks</h4>
                            <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: '#f59e0b', fontWeight: 700, margin: '0.5rem 0 0' }}>
                                {loading ? '...' : stats.pending_tasks}
                            </h1>
                        </div>
                        <div className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.75rem', borderRadius: '50%' }}>
                            <i className="fa-solid fa-clock" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                    </div>
                </div>

                <div className="glass-panel stat-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContext: 'space-between', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <h4 style={{ color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Completed Tasks</h4>
                            <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: '#10b981', fontWeight: 700, margin: '0.5rem 0 0' }}>
                                {loading ? '...' : stats.completed_tasks}
                            </h1>
                        </div>
                        <div className="card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.75rem', borderRadius: '50%' }}>
                            <i className="fa-solid fa-circle-check" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                    </div>
                </div>

                <div className="glass-panel stat-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContext: 'space-between', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <h4 style={{ color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Attendance Rate</h4>
                            <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: '#8b5cf6', fontWeight: 700, margin: '0.5rem 0 0' }}>
                                {loading ? '...' : `${stats.attendance_percentage}%`}
                            </h1>
                        </div>
                        <div className="card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '0.75rem', borderRadius: '50%' }}>
                            <i className="fa-solid fa-user-check" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Extra metrics widgets */}
            <div className="dual-panel" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Team Productivity Distribution</h3>
                    <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContext: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem', justifyContent: 'space-between' }}>
                                <span>Task Completion Target</span>
                                <span style={{ fontWeight: 600 }}>85% Done</span>
                            </div>
                            <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '85%', background: 'var(--primary-color)', borderRadius: '5px' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContext: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem', justifyContent: 'space-between' }}>
                                <span>Attendance Target</span>
                                <span style={{ fontWeight: 600 }}>94% Rate</span>
                            </div>
                            <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '94%', background: '#10b981', borderRadius: '5px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Dashboard;

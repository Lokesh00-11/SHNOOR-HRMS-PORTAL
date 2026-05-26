import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const HelpdeskDashboard = ({ role, onViewAll }) => {
    const [kpis, setKpis] = useState({
        open_tickets: 0,
        pending_tickets: 0,
        resolved_today: 0,
        escalated_tickets: 0,
        critical_tickets: 0,
        avg_resolution_time_hrs: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (role !== 'employee') {
            fetchAnalytics();
        } else {
            setLoading(false); 
        }
    }, [role]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const data = await get('/helpdesk/analytics/');
            if (data && data.kpis) {
                setKpis(data.kpis);
            }
        } catch (error) {
            console.error("Error fetching helpdesk analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (role === 'employee') {
        return (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
                    <i className="fa-solid fa-headset"></i>
                </div>
                <h3>Welcome to HRMS Support</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Create a new ticket or view your existing requests.</p>
                <button onClick={onViewAll} className="btn btn-primary">
                    View My Tickets
                </button>
            </div>
        );
    }

    if (loading) return <div>Loading Analytics...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Open Tickets</h4>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>{kpis.open_tickets}</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Pending</h4>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning-color)' }}>{kpis.pending_tickets}</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Resolved Today</h4>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success-color)' }}>{kpis.resolved_today}</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Avg Resolution</h4>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-secondary)' }}>{kpis.avg_resolution_time_hrs}h</div>
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <button onClick={onViewAll} className="btn btn-primary">
                    View All Tickets
                </button>
            </div>
        </div>
    );
};

export default HelpdeskDashboard;

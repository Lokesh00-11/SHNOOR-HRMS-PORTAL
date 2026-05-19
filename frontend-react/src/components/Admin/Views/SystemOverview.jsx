import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const SystemOverview = () => {
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        expiredTrials: 23 
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const companies = await get('/admin/companies/');
                const activeCount = companies.filter(c => c.is_active).length;
                const inactiveCount = companies.filter(c => !c.is_active).length;
                
                setStats({
                    total: companies.length,
                    active: activeCount,
                    inactive: inactiveCount,
                    expiredTrials: 23
                });
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>System Overview</h2>
            
            <div className="dashboard-grid">
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Companies</h4>
                    <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>
                        {loading ? '...' : stats.total}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Active Companies</h4>
                    <h1 style={{ fontSize: '2.5rem', color: '#10b981', marginTop: '0.5rem' }}>
                        {loading ? '...' : stats.active}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Inactive Companies</h4>
                    <h1 style={{ fontSize: '2.5rem', color: '#f43f5e', marginTop: '0.5rem' }}>
                        {loading ? '...' : stats.inactive}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Expired Trials</h4>
                    <h1 style={{ fontSize: '2.5rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                        {stats.expiredTrials}
                    </h1>
                </div>
            </div>
        </section>
    );
};

export default SystemOverview;

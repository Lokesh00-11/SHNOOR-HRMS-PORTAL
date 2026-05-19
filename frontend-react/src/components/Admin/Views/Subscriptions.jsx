import React from 'react';

const Subscriptions = () => {
    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Subscriptions</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Plan</th>
                            <th>Billing Cycle</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>TechFlow Inc.</td>
                            <td>Enterprise</td>
                            <td>Annually</td>
                            <td><span className="status active" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' }}>Active</span></td>
                        </tr>
                        <tr>
                            <td>Startup Hub</td>
                            <td>Pro</td>
                            <td>Monthly</td>
                            <td><span className="status expired" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' }}>Expired</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Subscriptions;

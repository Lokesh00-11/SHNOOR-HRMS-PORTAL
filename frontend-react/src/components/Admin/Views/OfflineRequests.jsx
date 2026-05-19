import React from 'react';

const OfflineRequests = () => {
    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Offline Payment Requests</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Amount</th>
                            <th>Requested On</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Nexus Dynamics</td>
                            <td>$499.00</td>
                            <td>Oct 22, 2026</td>
                            <td><span className="status expired" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' }}>Pending</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default OfflineRequests;

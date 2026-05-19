import React from 'react';

const Transactions = () => {
    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Recent Transactions</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Company</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>TXN-98432</td>
                            <td>TechFlow Inc.</td>
                            <td>$1,999.00</td>
                            <td>Oct 24, 2026</td>
                            <td><span className="status active" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' }}>Success</span></td>
                        </tr>
                        <tr>
                            <td>TXN-98431</td>
                            <td>Startup Hub</td>
                            <td>$99.00</td>
                            <td>Oct 23, 2026</td>
                            <td><span className="status inactive" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' }}>Failed</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Transactions;

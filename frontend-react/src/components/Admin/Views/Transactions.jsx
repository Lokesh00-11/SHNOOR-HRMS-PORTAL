import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const data = await get('/admin/transactions/');
            setTransactions(data || []);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError('Failed to fetch transaction logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Payment Transactions Log</h2>
            
            {error && (
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <p style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 500 }}>
                        <i className="fa-solid fa-triangle-exclamation"></i> {error}
                    </p>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Company Name</th>
                            <th>Plan Subscribed</th>
                            <th>Amount Paid</th>
                            <th>Payment Method</th>
                            <th>Transaction Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading transactions...</td>
                            </tr>
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No payment transactions recorded yet.</td>
                            </tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--primary-color)', fontFamily: 'monospace', fontSize: '0.85rem', letterSpacing: '0.3px' }}>
                                        {tx.transaction_id || `#${tx.id}`}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{tx.company_name}</td>
                                    <td>{tx.plan_name || 'Manual License Extension'}</td>
                                    <td style={{ fontWeight: 600 }}>₹{tx.amount}</td>
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <i className={`fa-solid ${tx.payment_method === 'Card' ? 'fa-credit-card' : 'fa-money-bill'}`} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
                                            {tx.payment_method || 'Card'}
                                        </span>
                                    </td>
                                    <td>{tx.transaction_date ? tx.transaction_date.split(' ')[0] : '-'}</td>
                                    <td>
                                        <span className={`status-badge ${(tx.status || 'Success').toLowerCase() === 'success' ? 'active' : 'expired'}`} style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                                            {tx.status || 'Success'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Transactions;

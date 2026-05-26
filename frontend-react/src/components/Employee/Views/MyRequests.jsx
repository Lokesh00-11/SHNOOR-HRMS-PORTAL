import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const str = String(dateStr).trim();
    if (str.includes('-') && str.split('-')[0].length === 2) {
        const parts = str.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00:00';
        const [day, month, year] = datePart.split('-');
        return new Date(`${year}-${month}-${day}T${timePart}`);
    }
    return new Date(str);
};

const MyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const [leavesData, expensesData] = await Promise.all([
                get('/employee/leaves/apply/'),
                get('/employee/expenses/')
            ]);

            const leaves = (Array.isArray(leavesData) ? leavesData : [])
                .map(l => ({
                    id: `leave-${l.id}`,
                    type: 'Leave',
                    title: `${l.leave_type} Leave`,
                    description: `${l.start_date} to ${l.end_date}\nReason: ${l.reason}`,
                    date: l.created_at || l.start_date,
                    status: l.status,
                    raw: l
                }));

            const expenses = (Array.isArray(expensesData) ? expensesData : [])
                .map(e => ({
                    id: `expense-${e.id}`,
                    type: 'Expense',
                    title: `${e.category} Expense - ₹${e.amount}`,
                    description: e.description || e.title,
                    date: e.submitted_at,
                    status: e.status,
                    raw: e
                }));

            const combined = [...leaves, ...expenses].sort((a, b) => parseDateString(b.date) - parseDateString(a.date));
            setRequests(combined);
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'approved') return <span className="status-badge" style={{ background: '#10b98120', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Approved</span>;
        if (s === 'rejected') return <span className="status-badge" style={{ background: '#ef444420', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Rejected</span>;
        return <span className="status-badge" style={{ background: '#f59e0b20', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Pending</span>;
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="gradient-text">My Requests</h2>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontWeight: 'bold' }}>
                    {requests.length} Total Requests
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Details</th>
                                <th>Date Submitted</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading your requests...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>You haven't submitted any requests yet.</td></tr>
                            ) : (
                                requests.map(req => (
                                    <tr key={req.id}>
                                        <td>
                                            <span className="status-badge" style={{ 
                                                background: req.type === 'Leave' ? '#3b82f620' : '#8b5cf620', 
                                                color: req.type === 'Leave' ? '#3b82f6' : '#8b5cf6', 
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                                            }}>
                                                {req.type}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{req.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{req.description}</div>
                                        </td>
                                        <td>{parseDateString(req.date).toLocaleDateString()}</td>
                                        <td>{getStatusBadge(req.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default MyRequests;

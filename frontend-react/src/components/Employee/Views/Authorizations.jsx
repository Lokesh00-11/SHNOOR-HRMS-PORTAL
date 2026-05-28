import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Authorizations = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const expensesData = await get('/teamleader/expenses/');

            const pendingExpenses = (Array.isArray(expensesData) ? expensesData : [])
                .filter(e => e.status === 'PENDING')
                .map(e => ({
                    id: e.id,
                    type: 'Expense',
                    employee_name: e.employee_name || e.employee?.username || 'Unknown',
                    title: `${e.category} Expense - ₹${e.amount}`,
                    description: e.description || e.title,
                    date: e.submitted_at,
                    raw: e
                }));

            setRequests(pendingExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (error) {
            console.error("Error fetching authorizations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (req) => {
        if (!window.confirm(`Approve this ${req.type} request?`)) return;
        
        try {
            await post('/teamleader/expenses/update/', { expense_id: req.id, status: 'APPROVED', remark: 'Approved by Team Leader' });
            fetchRequests();
        } catch (error) {
            console.error(`Error approving ${req.type}:`, error);
            alert(`Failed to approve ${req.type}.`);
        }
    };

    const handleReject = async (req) => {
        if (!window.confirm(`Reject this ${req.type} request?`)) return;
        
        try {
            await post('/teamleader/expenses/update/', { expense_id: req.id, status: 'REJECTED', remark: 'Rejected by Team Leader' });
            fetchRequests();
        } catch (error) {
            console.error(`Error rejecting ${req.type}:`, error);
            alert(`Failed to reject ${req.type}.`);
        }
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="gradient-text">Team Authorizations</h2>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontWeight: 'bold' }}>
                    {requests.length} Pending
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Team Member</th>
                                <th>Details</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading pending requests...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending authorizations from your team.</td></tr>
                            ) : (
                                requests.map(req => (
                                    <tr key={req.id}>
                                        <td>
                                            <span className="status-badge" style={{ 
                                                background: '#8b5cf620', 
                                                color: '#8b5cf6', 
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' 
                                            }}>
                                                {req.type}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{req.employee_name}</td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{req.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{req.description}</div>
                                        </td>
                                        <td>{new Date(req.date).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-ghost" onClick={() => handleApprove(req)} style={{ color: '#10b981', marginRight: '8px', padding: '6px 12px', border: '1px solid #10b98140' }}>
                                                Approve
                                            </button> 
                                            <button className="btn btn-ghost" onClick={() => handleReject(req)} style={{ color: '#ef4444', padding: '6px 12px', border: '1px solid #ef444440' }}>
                                                Reject
                                            </button>
                                        </td>
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

export default Authorizations;

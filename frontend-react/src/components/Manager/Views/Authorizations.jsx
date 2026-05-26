import React, { useState, useEffect } from 'react';
import { get, post, put } from '../../../services/api';

const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr === 'string') {
        const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s(\d{2}):(\d{2}):(\d{2}))?/);
        if (match) {
            const [_, day, month, year, hour, minute, second] = match;
            const isoString = `${year}-${month}-${day}T${hour || '00'}:${minute || '00'}:${second || '00'}Z`;
            const d = new Date(isoString);
            if (!isNaN(d.getTime())) return d.toISOString();
        }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toISOString();
};

const Authorizations = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const [leavesData, expensesData, queriesData] = await Promise.all([
                get('/manager/leaves/'),
                get('/manager/expenses/'),
                get('/manager/queries/').catch(() => get('/api/manager/queries/').catch(() => []))
            ]);

            const pendingLeaves = (Array.isArray(leavesData) ? leavesData : [])
                .filter(l => l.status === 'pending')
                .map(l => ({
                    id: l.id,
                    type: 'Leave',
                    employee_name: l.employee_name || l.employee?.username || 'Unknown',
                    title: `${l.leave_type} Leave`,
                    description: `${l.start_date} to ${l.end_date}\nReason: ${l.reason}`,
                    date: parseDateString(l.created_at || l.start_date),
                    raw: l
                }));

            const pendingExpenses = (Array.isArray(expensesData) ? expensesData : [])
                .filter(e => e.status === 'PENDING')
                .map(e => ({
                    id: e.id,
                    type: 'Expense',
                    employee_name: e.employee_name || e.employee?.username || 'Unknown',
                    title: `${e.category} Expense - ₹${e.amount}`,
                    description: e.description || e.title,
                    date: parseDateString(e.submitted_at),
                    raw: e
                }));

            const pendingQueries = (Array.isArray(queriesData) ? queriesData : [])
                .filter(q => (q.status || 'pending').toLowerCase() === 'pending')
                .map(q => ({
                    id: q.id || q._id,
                    type: 'Query',
                    employee_name: q.sender_name || q.employee_name || q.sender || 'Unknown',
                    title: q.subject || 'Query',
                    description: q.message || q.description || q.text || '',
                    date: parseDateString(q.created_at || q.updated_at || q.date),
                    raw: q
                }));

            const combined = [...pendingLeaves, ...pendingExpenses, ...pendingQueries].sort((a, b) => new Date(b.date) - new Date(a.date));
            setRequests(combined);
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
            if (req.type === 'Leave') {
                await post('/manager/leaves/update-status/', { leave_id: req.id, status: 'Approved' });
            } else if (req.type === 'Expense') {
                await post('/manager/expenses/approve/', { expense_id: req.id, status: 'APPROVED', remark: 'Approved via Authorizations dashboard' });
            }
            fetchRequests();
        } catch (error) {
            console.error(`Error approving ${req.type}:`, error);
            alert(`Failed to approve ${req.type}.`);
        }
    };

    const handleReject = async (req) => {
        if (!window.confirm(`Reject this ${req.type} request?`)) return;
        
        try {
            if (req.type === 'Leave') {
                await post('/manager/leaves/update-status/', { leave_id: req.id, status: 'Rejected' });
            } else if (req.type === 'Expense') {
                await post('/manager/expenses/approve/', { expense_id: req.id, status: 'REJECTED', remark: 'Rejected via Authorizations dashboard' });
            }
            fetchRequests();
        } catch (error) {
            console.error(`Error rejecting ${req.type}:`, error);
            alert(`Failed to reject ${req.type}.`);
        }
    };

    const handleReplySubmit = async (e, queryId) => {
        e.preventDefault();
        try {
            const payload = {
                query_id: queryId,
                reply: replyText,
                status: 'resolved'
            };

            try {
                await put('/manager/queries/', payload);
            } catch (fallbackErr) {
                await put('/api/manager/queries/', payload);
            }

            alert('Reply sent successfully!');
            setReplyingTo(null);
            setReplyText('');
            fetchRequests();
        } catch (err) {
            console.error('Error submitting reply:', err);
            alert('Failed to send reply');
        }
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="gradient-text">Pending Authorizations</h2>
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
                                <th>Employee</th>
                                <th>Details</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading pending requests...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending authorizations. You're all caught up!</td></tr>
                            ) : (
                                requests.map((req, index) => (
                                    <React.Fragment key={`${req.type}-${req.id || index}`}>
                                        <tr>
                                            <td>
                                                <span className="status-badge" style={{ 
                                                    background: req.type === 'Leave' ? '#3b82f620' : (req.type === 'Expense' ? '#8b5cf620' : '#f59e0b20'), 
                                                    color: req.type === 'Leave' ? '#3b82f6' : (req.type === 'Expense' ? '#8b5cf6' : '#f59e0b'), 
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
                                            <td>{req.date && !isNaN(new Date(req.date).getTime()) ? new Date(req.date).toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                {req.type === 'Query' ? (
                                                    <button className="btn btn-ghost" onClick={() => {
                                                        setReplyingTo(replyingTo === req.id ? null : req.id);
                                                        setReplyText('');
                                                    }} style={{ color: '#3b82f6', padding: '6px 12px', border: '1px solid #3b82f640' }}>
                                                        {replyingTo === req.id ? 'Cancel' : 'Reply'}
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button className="btn btn-ghost" onClick={() => handleApprove(req)} style={{ color: '#10b981', marginRight: '8px', padding: '6px 12px', border: '1px solid #10b98140' }}>
                                                            Approve
                                                        </button>
                                                        <button className="btn btn-ghost" onClick={() => handleReject(req)} style={{ color: '#ef4444', padding: '6px 12px', border: '1px solid #ef444440' }}>
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                        {replyingTo === req.id && req.type === 'Query' && (
                                            <tr>
                                                <td colSpan="5">
                                                    <div className="glass-panel" style={{ padding: '1rem', margin: '0.5rem 0' }}>
                                                        <form onSubmit={(e) => handleReplySubmit(e, req.id)} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <h5 style={{ marginBottom: '0.5rem' }}>Your Reply to {req.employee_name}</h5>
                                                                <textarea 
                                                                    className="form-control"
                                                                    rows="2"
                                                                    value={replyText}
                                                                    onChange={(e) => setReplyText(e.target.value)}
                                                                    placeholder="Type your reply here..."
                                                                    required
                                                                    style={{ width: '100%', resize: 'vertical' }}
                                                                ></textarea>
                                                            </div>
                                                            <button type="submit" className="btn btn-primary">Send Reply</button>
                                                        </form>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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

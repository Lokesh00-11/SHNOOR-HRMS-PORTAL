import React, { useState, useEffect } from 'react';
import { get, put } from '../../../services/api';

const Queries = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const fetchQueries = async () => {
        try {
            setLoading(true);
            
            // Safe request: Checks both absolute '/api/manager/queries/' and relative routes
            let data;
            try {
                data = await get('/api/manager/queries/');
            } catch (fallbackErr) {
                // If api service already prepends '/api', fallback to original path
                data = await get('/manager/queries/');
            }
            
            // Console log to debug payload layout during testing if needed
            console.log('Fetched Employee Queries Payload:', data);
            setQueries(data || []);
        } catch (err) {
            console.error('Error fetching queries:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueries();
    }, []);

    const handleReplySubmit = async (e, queryId) => {
        e.preventDefault();
        try {
            // Checks both paths for updating the status/reply payload
            const payload = {
                query_id: queryId,
                reply: replyText,
                status: 'resolved'
            };

            try {
                await put('/api/manager/queries/', payload);
            } catch (fallbackErr) {
                await put('/manager/queries/', payload);
            }

            alert('Reply sent successfully!');
            setReplyingTo(null);
            setReplyText('');
            fetchQueries();
        } catch (err) {
            console.error('Error submitting reply:', err);
            alert('Failed to send reply');
        }
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">Employee Queries</h2>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Reply</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading queries...</td></tr>
                        ) : queries.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>No queries found</td></tr>
                        ) : (
                            queries.map((q, index) => {
                                const uniqueId = q.id || q._id || index;
                                const employeeName = q.sender_name || q.employee_name || q.sender || 'Unknown Employee';
                                const queryMessage = q.message || q.description || q.text || '';
                                const queryStatus = (q.status || 'pending').toLowerCase();

                                return (
                                    <React.Fragment key={uniqueId}>
                                        <tr>
                                            <td style={{ fontWeight: 'bold' }}>{employeeName}</td>
                                            <td>{q.subject || 'No Subject'}</td>
                                            <td>{queryMessage}</td>
                                            <td>
                                                {q.reply ? (
                                                    q.reply
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>No reply yet</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${queryStatus === 'resolved' ? 'active' : 'pending'}`}>
                                                    {queryStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn btn-ghost"
                                                    onClick={() => {
                                                        setReplyingTo(replyingTo === uniqueId ? null : uniqueId);
                                                        setReplyText(q.reply || '');
                                                    }}
                                                >
                                                    {replyingTo === uniqueId ? 'Cancel' : 'Reply'}
                                                </button>
                                            </td>
                                        </tr>
                                        {replyingTo === uniqueId && (
                                            <tr>
                                                <td colSpan="6">
                                                    <div className="glass-panel" style={{ padding: '1rem', margin: '0.5rem 0' }}>
                                                        <form onSubmit={(e) => handleReplySubmit(e, uniqueId)} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <h5 style={{ marginBottom: '0.5rem' }}>Your Reply to {employeeName}</h5>
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
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Queries;
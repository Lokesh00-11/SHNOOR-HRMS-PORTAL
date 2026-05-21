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
            const data = await get('/teamleader/queries/');
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
            await put('/teamleader/queries/', {
                query_id: queryId,
                reply: replyText,
                status: 'resolved'
            });
            alert('Reply sent successfully!');
            setReplyingTo(null);
            setReplyText('');
            fetchQueries();
        } catch (err) {
            alert('Failed to send reply');
        }
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">Team Queries</h2>
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
                            queries.map((q, index) => (
                                <React.Fragment key={q.id || index}>
                                    <tr>
                                        <td style={{ fontWeight: 'bold' }}>{q.sender_name}</td>
                                        <td>{q.subject}</td>
                                        <td>{q.message}</td>
                                        <td>{q.reply ? q.reply : <span style={{ color: 'var(--text-muted)' }}>No reply yet</span>}</td>
                                        <td>
                                            <span className={`status-badge ${q.status === 'resolved' ? 'active' : 'pending'}`}>
                                                {q.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-ghost"
                                                onClick={() => {
                                                    setReplyingTo(replyingTo === q.id ? null : q.id);
                                                    setReplyText(q.reply || '');
                                                }}
                                            >
                                                {replyingTo === q.id ? 'Cancel' : 'Reply'}
                                            </button>
                                        </td>
                                    </tr>
                                    {replyingTo === q.id && (
                                        <tr>
                                            <td colSpan="6">
                                                <div className="glass-panel" style={{ padding: '1rem', margin: '0.5rem 0' }}>
                                                    <form onSubmit={(e) => handleReplySubmit(e, q.id)} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <h5 style={{ marginBottom: '0.5rem' }}>Your Reply to {q.sender_name}</h5>
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
        </section>
    );
};

export default Queries;

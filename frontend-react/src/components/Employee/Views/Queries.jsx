import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Queries = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        target_role: 'manager',
        subject: '',
        message: ''
    });

    const fetchQueries = async () => {
        try {
            setLoading(true);
            const data = await get('/employee/queries/');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await post('/employee/queries/', formData);
            alert('Query sent successfully!');
            setShowForm(false);
            setFormData({ target_role: 'manager', subject: '', message: '' });
            fetchQueries();
        } catch (err) {
            alert('Failed to send query');
        }
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">My Queries</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : 'Send New Query'}
                </button>
            </div>

            {showForm && (
                <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Send Support Query</h4>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="setting-item">
                            <h4>Send To</h4>
                            <select 
                                value={formData.target_role} 
                                onChange={(e) => setFormData({...formData, target_role: e.target.value})}
                                className="form-control"
                            >
                                <option value="manager">Manager</option>
                                <option value="team_leader">Team Leader</option>
                            </select>
                        </div>
                        <div className="setting-item">
                            <h4>Subject</h4>
                            <input 
                                type="text" 
                                required 
                                value={formData.subject}
                                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                placeholder="Enter subject"
                                className="form-control"
                            />
                        </div>
                        <div className="setting-item">
                            <h4>Message</h4>
                            <textarea 
                                required 
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                placeholder="Describe your query..."
                                className="form-control"
                                rows="4"
                                style={{ width: '100%', resize: 'vertical' }}
                            ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Send Query</button>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Sent To</th>
                            <th>Message</th>
                            <th>Reply</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading queries...</td></tr>
                        ) : queries.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No queries found</td></tr>
                        ) : (
                            queries.map((q, index) => (
                                <tr key={q.id || index}>
                                    <td style={{ fontWeight: 'bold' }}>{q.subject}</td>
                                    <td>{q.target_role === 'team_leader' ? 'Team Leader' : 'Manager'}</td>
                                    <td>{q.message}</td>
                                    <td>{q.reply ? q.reply : <span style={{ color: 'var(--text-muted)' }}>Waiting for reply...</span>}</td>
                                    <td>
                                        <span className={`status-badge ${q.status === 'resolved' ? 'active' : 'pending'}`}>
                                            {q.status}
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

export default Queries;

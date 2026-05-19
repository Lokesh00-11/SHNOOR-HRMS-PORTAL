import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await get('/notifications/');
            setNotifications(data.sent || []);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleSendNotification = async (e) => {
        e.preventDefault();
        try {
            setSubmitLoading(true);
            await post('/notifications/', { title, message });
            alert('Announcement sent successfully!');
            setTitle('');
            setMessage('');
            await fetchNotifications();
        } catch (err) {
            console.error('Error sending notification:', err);
            alert('Error sending announcement');
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Announcements</h2>
            
            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Send Announcement to Managers</h4>
                <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Title</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            required 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} 
                            placeholder="Announcement Title" 
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Message</label>
                        <textarea 
                            className="form-control" 
                            required 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', minHeight: '100px' }} 
                            placeholder="Type your message here..."
                        ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', width: 'fit-content' }} disabled={submitLoading}>
                        {submitLoading ? 'Sending...' : 'Send Announcement'}
                    </button>
                </form>
            </div>

            <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Sent Announcements</h4>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Title</th>
                            <th>Message</th>
                            <th>Target</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : notifications.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No announcements sent yet.</td></tr>
                        ) : (
                            notifications.map(notif => (
                                <tr key={notif.id || Math.random()}>
                                    <td>
                                        {new Date(notif.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{notif.title}</td>
                                    <td>{notif.message}</td>
                                    <td>
                                        <span className="status active" style={{ fontSize: '0.75rem' }}>
                                            {notif.target_role?.toUpperCase()}
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

export default Notifications;

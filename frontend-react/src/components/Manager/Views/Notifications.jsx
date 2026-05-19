import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const parseCustomDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return null;
    
    const parts = dateStr.split(' ');
    const dateParts = parts[0].split('-');
    
    if (dateParts.length !== 3) return new Date(dateStr);
    
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    
    if (parts.length > 1) {
        const timeParts = parts[1].split(':');
        const hour = parseInt(timeParts[0], 10);
        const minute = parseInt(timeParts[1], 10);
        const second = parseInt(timeParts[2], 10) || 0;
        return new Date(year, month, day, hour, minute, second);
    }
    
    return new Date(year, month, day);
};

const Notifications = ({ currentMode }) => {
    const [notifications, setNotifications] = useState({ received: [], sent: [] });
    const [loading, setLoading] = useState(true);

    // Send Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await get('/notifications/');
            setNotifications(data || { received: [], sent: [] });
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleSendAnnouncement = async (e) => {
        e.preventDefault();
        try {
            await post('/notifications/', { title, message });
            alert('Announcement sent to all employees!');
            setTitle('');
            setMessage('');
            fetchNotifications();
        } catch (err) {
            alert('Failed to send announcement.');
            console.error(err);
        }
    };

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Announcements & Notifications</h2>

            {currentMode === 'manager' && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>BroadCast New Announcement</h4>
                    <form onSubmit={handleSendAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Subject</label>
                            <input 
                                type="text" 
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter subject header..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Message</label>
                            <textarea 
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows="3"
                                placeholder="Write the announcement description..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'none' }}
                            />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Broadcast Announcement</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="dual-panel">
                <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
                    <h4 style={{ marginBottom: '1rem' }}>Announcements from Admin</h4>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Title</th>
                                    <th>Message</th>
                                    <th>Sender</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td></tr>
                                ) : notifications.received.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No announcements from admin.</td></tr>
                                ) : (
                                    notifications.received.map((notif, index) => (
                                        <tr key={notif.id || index}>
                                            <td>{(() => {
                                                const parsedDate = parseCustomDate(notif.created_at);
                                                return parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : '-';
                                            })()}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{notif.title}</td>
                                            <td>{notif.message}</td>
                                            <td>Admin</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {currentMode === 'manager' && (
                    <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
                        <h4 style={{ marginBottom: '1rem' }}>Broadcast History</h4>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Title</th>
                                        <th>Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="3" style={{ textAlign: 'center' }}>Loading...</td></tr>
                                    ) : notifications.sent.length === 0 ? (
                                        <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>You haven't broadcasted any announcements yet.</td></tr>
                                    ) : (
                                        notifications.sent.map((notif, index) => (
                                            <tr key={notif.id || index}>
                                                <td>{(() => {
                                                    const parsedDate = parseCustomDate(notif.created_at);
                                                    return parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : '-';
                                                })()}</td>
                                                <td style={{ fontWeight: 600 }}>{notif.title}</td>
                                                <td>{notif.message}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Notifications;

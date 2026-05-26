import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Notifications = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await get('/notifications/');
            setMessages(data?.received || []);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const formatNotificationDate = (dateString) => {
        if (!dateString) return new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // If it's already a nicely formatted string from the backend (DD-MM-YYYY HH:mm:ss)
        if (typeof dateString === 'string' && dateString.includes('-') && dateString.includes(':')) {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) {
                // If JS can't parse it, just return the backend string as it is already human readable
                return dateString;
            }
        }
        
        try {
            const d = new Date(dateString);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        } catch (e) {}
        
        // Fallback to current date
        return new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Corporate Alerts & System Broadcasts</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading alerts...</div>
                ) : messages.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No system broadcasts or notifications received yet.</p>
                ) : (
                    messages.map((m, index) => {
                        const dateStr = formatNotificationDate(m.created_at);
                        return (
                            <div key={m.id || index} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <h4 style={{ fontWeight: 600, fontSize: '1.05rem', margin: 0 }}>{m.title}</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dateStr}</span>
                                </div>
                                <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>{m.message}</p>
                                <small style={{ color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Sender: {m.sender_name} ({m.sender_role})
                                </small>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default Notifications;

import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await get('/notifications/');
            setNotifications(data?.received || []);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Announcements</h2>
            
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Title</th>
                            <th>Message</th>
                            <th>From</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : notifications.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No announcements from management.</td></tr>
                        ) : (
                            notifications.map((notif, index) => (
                                <tr key={index}>
                                    <td style={{ fontSize: '0.85rem' }}>{new Date(notif.created_at).toLocaleString()}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{notif.title}</td>
                                    <td style={{ fontSize: '0.9rem' }}>{notif.message}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{notif.sender_name} <br/><small>{notif.sender_role}</small></td>
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

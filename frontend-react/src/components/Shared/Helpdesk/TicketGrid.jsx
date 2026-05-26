import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';
import CreateTicketModal from './CreateTicketModal';

const TicketGrid = ({ role, onViewTicket }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const data = await get('/helpdesk/tickets/');
            setTickets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching tickets", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'var(--primary-color)';
            case 'In Progress': return 'var(--accent-secondary)';
            case 'Pending': return 'var(--warning-color)';
            case 'Resolved': return 'var(--success-color)';
            case 'Closed': return 'var(--text-muted)';
            case 'Escalated': return 'var(--danger-color)';
            default: return 'var(--text-muted)';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return 'var(--danger-color)';
            case 'High': return 'var(--warning-color)';
            case 'Medium': return 'var(--primary-color)';
            case 'Low': return 'var(--success-color)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Support Tickets</h3>
                <button 
                    onClick={() => setShowCreate(true)}
                    className="btn btn-primary"
                >
                    <i className="fa-solid fa-plus"></i> New Ticket
                </button>
            </div>

            <div className="glass-panel table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                            <th>Created By</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center' }}>Loading tickets...</td></tr>
                        ) : tickets.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No tickets found.</td></tr>
                        ) : (
                            tickets.map(t => (
                                <tr key={t.id}>
                                    <td>#{t.id}</td>
                                    <td style={{ fontWeight: '500' }}>{t.title}</td>
                                    <td>{t.category_name || '-'}</td>
                                    <td>
                                        <span style={{ color: getPriorityColor(t.priority), fontWeight: '600', fontSize: '0.85rem' }}>
                                            {t.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', border: `1px solid ${getStatusColor(t.status)}`, background: 'var(--bg-tertiary)', color: getStatusColor(t.status) }}>
                                            {t.status}
                                        </span>
                                        {t.status === 'Escalated' && (
                                            <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', background: 'var(--danger-color)', color: 'white' }}>
                                                <i className="fa-solid fa-fire"></i>
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ color: t.assigned_to_name ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                        {t.assigned_to_name || 'Unassigned'}
                                    </td>
                                    <td>{t.created_by_name}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.created_at.split('T')[0]}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button onClick={() => onViewTicket(t)} className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {showCreate && (
                <CreateTicketModal 
                    onClose={() => setShowCreate(false)} 
                    onSuccess={() => { setShowCreate(false); fetchTickets(); }} 
                />
            )}
        </div>
    );
};

export default TicketGrid;

import React, { useState, useEffect } from 'react';
import { get, post, patch } from '../../../services/api';

const TicketDetailView = ({ role, ticketId, onBack }) => {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [showEscalate, setShowEscalate] = useState(false);
    const [escalateReason, setEscalateReason] = useState('');

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const data = await get(`/helpdesk/tickets/${ticketId}/`);
            setTicket(data);
        } catch (error) {
            console.error("Error fetching ticket detail", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ticketId) fetchTicket();
    }, [ticketId]);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;
        try {
            await post(`/helpdesk/tickets/${ticketId}/reply/`, {
                message: reply,
                is_internal_note: isInternal
            });
            setReply('');
            setIsInternal(false);
            fetchTicket();
        } catch (error) {
            console.error("Error posting reply", error);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await patch(`/helpdesk/tickets/${ticketId}/`, { status: newStatus });
            fetchTicket();
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    const handleEscalate = async () => {
        if (!escalateReason.trim()) return;
        try {
            await post(`/helpdesk/tickets/${ticketId}/escalate/`, { reason: escalateReason });
            setShowEscalate(false);
            setEscalateReason('');
            fetchTicket();
        } catch (error) {
            console.error("Error escalating ticket", error);
            alert("Failed to escalate ticket. " + (error.response?.data?.message || ""));
        }
    };

    if (loading) return <div>Loading ticket details...</div>;
    if (!ticket) return <div>Ticket not found.</div>;

    const isEmployee = role === 'employee';

    return (
        <div className="fade-in">
            <button onClick={onBack} className="btn btn-ghost" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                <i className="fa-solid fa-arrow-left"></i> Back to Tickets
            </button>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* Main Thread */}
                <div style={{ flex: 2 }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 className="gradient-text" style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>{ticket.title}</h3>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Created by <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{ticket.created_by_name}</span> on {ticket.created_at}
                                </div>
                            </div>
                            <span style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '600', background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                                #{ticket.id}
                            </span>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '1.5rem', whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
                            {ticket.description}
                        </div>
                    </div>

                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Conversation Thread</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                        {(ticket.replies || []).map(r => (
                            <div key={r.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: r.is_internal_note ? '4px solid var(--warning-color)' : '4px solid var(--primary-color)', background: r.is_internal_note ? 'var(--bg-tertiary)' : 'var(--glass-bg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                        {r.user_name} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({r.user_role})</span>
                                        {r.is_internal_note && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.1rem 0.4rem', background: 'var(--warning-color)', color: 'white', borderRadius: '4px' }}>INTERNAL NOTE</span>}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {r.created_at}
                                    </div>
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>{r.message}</div>
                            </div>
                        ))}
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <form onSubmit={handleReply}>
                            <textarea 
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                placeholder="Type your reply here..."
                                rows="4"
                                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'vertical', marginBottom: '1rem' }}
                                required
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    {!isEmployee && (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                                            Mark as Internal Note
                                        </label>
                                    )}
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    Post Reply
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', color: 'var(--text-main)' }}>Ticket Info</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{ticket.status}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Priority:</span>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{ticket.priority}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Category:</span>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{ticket.category_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Assigned:</span>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{ticket.assigned_to_name || 'Unassigned'}</span>
                        </div>
                        
                        {(!isEmployee) && ticket.status !== 'Closed' && ticket.status !== 'Resolved' && (
                            <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Change Status</label>
                                <select 
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    value={ticket.status}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                    {ticket.status !== 'Escalated' && <option value="Escalated">Escalated</option>}
                                </select>
                            </div>
                        )}
                        {isEmployee && ticket.status !== 'Closed' && ticket.status !== 'Resolved' && (
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                <button onClick={() => handleStatusChange('Resolved')} className="btn btn-ghost" style={{ width: '100%', border: '1px solid var(--success-color)', color: 'var(--success-color)', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px' }}>
                                    Mark as Resolved
                                </button>
                            </div>
                        )}
                        
                        {role === 'team_leader' && ticket.status !== 'Closed' && ticket.status !== 'Resolved' && !showEscalate && (
                            <button onClick={() => setShowEscalate(true)} className="btn btn-ghost" style={{ width: '100%', border: '1px solid var(--warning-color)', color: 'var(--warning-color)', marginTop: '1rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px' }}>
                                <i className="fa-solid fa-arrow-up-right-from-square"></i> Escalate to Manager
                            </button>
                        )}
                        {role === 'manager' && ticket.status !== 'Closed' && ticket.status !== 'Resolved' && !showEscalate && (
                            <button onClick={() => setShowEscalate(true)} className="btn btn-ghost" style={{ width: '100%', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', marginTop: '1rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px' }}>
                                <i className="fa-solid fa-arrow-up-right-from-square"></i> Escalate to Admin
                            </button>
                        )}
                        
                        {showEscalate && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--warning-color)' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'block' }}>Reason for Escalation:</label>
                                <textarea 
                                    value={escalateReason}
                                    onChange={e => setEscalateReason(e.target.value)}
                                    rows="3"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', marginBottom: '0.5rem', resize: 'vertical' }}
                                    placeholder="Explain why this ticket requires escalation..."
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={handleEscalate} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Submit</button>
                                    <button onClick={() => setShowEscalate(false)} className="btn btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetailView;


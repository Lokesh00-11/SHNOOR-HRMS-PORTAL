import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Leaves = ({ currentMode }) => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Self Mode Apply Form State
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [formData, setFormData] = useState({
        leave_type: 'Sick',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            if (currentMode === 'manager') {
                const data = await get('/manager/leaves/');
                setLeaves(data || []);
            } else {
                const data = await get('/employee/leaves/');
                setLeaves(data || []);
            }
        } catch (err) {
            console.error('Error fetching leaves:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [currentMode]);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await post('/manager/leaves/update-status/', {
                leave_id: id,
                status: newStatus
            });
            alert(`Leave request ${newStatus.toLowerCase()} successfully.`);
            fetchLeaves();
        } catch (err) {
            alert('Failed to update leave status.');
            console.error(err);
        }
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        try {
            await post('/employee/leaves/apply/', formData);
            alert('Leave request submitted!');
            setShowApplyForm(false);
            setFormData({
                leave_type: 'Sick',
                start_date: '',
                end_date: '',
                reason: ''
            });
            fetchLeaves();
        } catch (err) {
            alert('Failed to submit leave request.');
            console.error(err);
        }
    };

    if (currentMode === 'manager') {
        return (
            <section className="view-section active">
                <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Team Leave Requests</h2>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Leave Type</th>
                                <th>Dates</th>
                                <th>Action/Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading leave requests...</td></tr>
                            ) : leaves.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center' }}>No team leave requests found</td></tr>
                            ) : (
                                leaves.map((req, index) => {
                                    const statusLower = (req.status || '').toLowerCase();
                                    const statusClass = statusLower === 'approved' ? 'active' : (statusLower === 'rejected' ? 'expired' : 'pending');
                                    return (
                                        <tr key={req.id || index}>
                                            <td style={{ fontWeight: 600 }}>{req.employee_name}</td>
                                            <td>{req.leave_type}</td>
                                            <td>{req.start_date} to {req.end_date}</td>
                                            <td>
                                                {statusLower === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button 
                                                            className="btn btn-primary" 
                                                            onClick={() => handleUpdateStatus(req.id, 'Approved')} 
                                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            className="btn btn-ghost" 
                                                            onClick={() => handleUpdateStatus(req.id, 'Rejected')} 
                                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: '#f43f5e' }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`status-badge ${statusClass}`}>
                                                        {req.status}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        );
    }

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">My Leave Requests</h2>
                <button className="btn btn-primary" onClick={() => setShowApplyForm(!showApplyForm)}>
                    {showApplyForm ? 'Cancel' : 'Apply Leave'}
                </button>
            </div>

            {showApplyForm && (
                <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Submit Leave Request</h4>
                    <form onSubmit={handleApplyLeave} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div className="setting-item" style={{ flex: 1, minWidth: '150px' }}>
                            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Leave Type</h4>
                            <select 
                                value={formData.leave_type} 
                                onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            >
                                <option value="Sick">Sick</option>
                                <option value="Casual">Casual</option>
                                <option value="Vacation">Vacation</option>
                            </select>
                        </div>
                        <div className="setting-item" style={{ flex: 1, minWidth: '150px' }}>
                            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Start Date</h4>
                            <input 
                                type="date" 
                                required 
                                value={formData.start_date}
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="setting-item" style={{ flex: 1, minWidth: '150px' }}>
                            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>End Date</h4>
                            <input 
                                type="date" 
                                required 
                                value={formData.end_date}
                                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="setting-item" style={{ flex: 2, minWidth: '250px' }}>
                            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Reason</h4>
                            <input 
                                type="text" 
                                required 
                                value={formData.reason}
                                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                placeholder="Brief reason"
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 1.5rem' }}>Submit</button>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Leave Type</th>
                            <th>Dates</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center' }}>Loading leaves...</td></tr>
                        ) : leaves.length === 0 ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center' }}>No leave requests found</td></tr>
                        ) : (
                            leaves.map((req, index) => {
                                const statusLower = (req.status || '').toLowerCase();
                                const statusClass = statusLower === 'approved' ? 'active' : (statusLower === 'rejected' ? 'expired' : 'pending');
                                return (
                                    <tr key={req.id || index}>
                                        <td style={{ fontWeight: 600 }}>{req.leave_type}</td>
                                        <td>{req.start_date} to {req.end_date}</td>
                                        <td>
                                            <span className={`status-badge ${statusClass}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Leaves;

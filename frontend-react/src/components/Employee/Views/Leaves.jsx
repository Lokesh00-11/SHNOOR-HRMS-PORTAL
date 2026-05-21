import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Leaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [stats, setStats] = useState({
        sick_leaves: 7,
        casual_leaves: 7,
        vacation_leaves: 7,
        paid_leaves_taken: 0
    });
    const [formData, setFormData] = useState({
        leave_type: 'Sick',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const [leavesData, statsData] = await Promise.all([
                get('/employee/leaves/'),
                get('/employee/stats/')
            ]);
            setLeaves(leavesData || []);
            if (statsData) {
                setStats(statsData);
            }
        } catch (err) {
            console.error('Error fetching leaves data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await post('/employee/leaves/apply/', formData);
            alert('Leave request submitted!');
            setShowForm(false);
            fetchLeaves();
        } catch (err) {
            alert('Failed to apply for leave');
        }
    };

    // Calculate leave metrics dynamically
    let totalDays = 0;
    let approvedDays = 0;
    let pendingDays = 0;

    leaves.forEach(item => {
        const start = new Date(item.start_date);
        const end = new Date(item.end_date);
        const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (!isNaN(days)) {
            totalDays += days;
            if (item.status.toUpperCase() === 'APPROVED') {
                approvedDays += days;
            } else if (item.status.toUpperCase() === 'PENDING') {
                pendingDays += days;
            }
        }
    });

    return (
        <section className="view-section active">
            <style>{`
                .leaves-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                @media (max-width: 992px) {
                    .leaves-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 600px) {
                    .leaves-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">My Leaves</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : 'Apply Leave'}
                </button>
            </div>

            <div className="leaves-grid">
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-muted)' }}>Free Sick Leaves</h4>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginTop: '0.5rem' }}>{stats.sick_leaves} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 7 left</span></h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-muted)' }}>Free Casual Leaves</h4>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginTop: '0.5rem' }}>{stats.casual_leaves} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 7 left</span></h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-muted)' }}>Free Vacation Leaves</h4>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginTop: '0.5rem' }}>{stats.vacation_leaves} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 7 left</span></h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-muted)' }}>Paid Leaves Taken</h4>
                    <h1 style={{ fontSize: '2rem', color: 'var(--danger-color)', marginTop: '0.5rem' }}>{stats.paid_leaves_taken}</h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-muted)' }}>Total Approved</h4>
                    <h1 style={{ fontSize: '2rem', color: '#10b981', marginTop: '0.5rem' }}>{approvedDays}</h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-muted)' }}>Total Pending</h4>
                    <h1 style={{ fontSize: '2rem', color: '#f59e0b', marginTop: '0.5rem' }}>{pendingDays}</h1>
                </div>
            </div>

            {showForm && (
                <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Submit Leave Request</h4>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div className="setting-item" style={{ flex: 1, minWidth: '150px' }}>
                            <h4>Leave Type</h4>
                            <select 
                                value={formData.leave_type} 
                                onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                            >
                                <option value="Sick">Sick</option>
                                <option value="Casual">Casual</option>
                                <option value="Vacation">Vacation</option>
                            </select>
                        </div>
                        <div className="setting-item" style={{ flex: 1, minWidth: '150px' }}>
                            <h4>Start Date</h4>
                            <input 
                                type="date" 
                                required 
                                value={formData.start_date}
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                            />
                        </div>
                        <div className="setting-item" style={{ flex: 1, minWidth: '150px' }}>
                            <h4>End Date</h4>
                            <input 
                                type="date" 
                                required 
                                value={formData.end_date}
                                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                            />
                        </div>
                        <div className="setting-item" style={{ flex: 2, minWidth: '250px' }}>
                            <h4>Reason</h4>
                            <input 
                                type="text" 
                                required 
                                value={formData.reason}
                                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                placeholder="Brief reason"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ height: '45px' }}>Submit</button>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Dates</th>
                            <th>Reason</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : leaves.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No leave requests found</td></tr>
                        ) : (
                            leaves.map((l, index) => (
                                <tr key={index}>
                                    <td>{l.leave_type}</td>
                                    <td>{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</td>
                                    <td>{l.reason}</td>
                                    <td>
                                        <span className={`status-badge ${l.status.toLowerCase()}`}>
                                            {l.status}
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

export default Leaves;

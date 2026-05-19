import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Leaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        leave_type: 'Sick',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const data = await get('/employee/leaves/');
            setLeaves(data || []);
        } catch (err) {
            console.error('Error fetching leaves:', err);
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

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">My Leaves</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : 'Apply Leave'}
                </button>
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

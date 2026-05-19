import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Offboarding = () => {
    const [activeTab, setActiveTab] = useState('warnings');
    const [allRecords, setAllRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ actionType: 'resignation', reason: '', file: null });

    const fetchOffboardingData = async () => {
        try {
            setLoading(true);
            
            const records = await get('/employee/offboardings/');
            setAllRecords(records || []);
        } catch (err) {
            console.error('Error fetching offboarding data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffboardingData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            
            await post('/employee/offboardings/', { 
                action_type: formData.actionType, 
                reason: formData.reason 
            });
            alert('Request submitted successfully!');
            setFormData({ ...formData, reason: '' });
            fetchOffboardingData();
        } catch (err) {
            alert('Failed to submit request: ' + err.message);
        }
    };

    const renderTable = () => {
        
        const filteredData = allRecords.filter(item => {
            if (activeTab === 'warnings') return item.action_type === 'warning';
            if (activeTab === 'resignations') return item.action_type === 'resignation';
            if (activeTab === 'complaints') return item.action_type === 'complaint';
            return false;
        });
        
        if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
        if (filteredData.length === 0) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No records found for this section.</div>;

        return (
            <table>
                <thead>
                    {activeTab === 'warnings' ? (
                        <tr>
                            <th>Date</th>
                            <th>Warning Title</th>
                            <th>Reason</th>
                            <th>Status</th>
                        </tr>
                    ) : activeTab === 'resignations' ? (
                        <tr>
                            <th>Date Filed</th>
                            <th>Reason</th>
                            <th>Status</th>
                        </tr>
                    ) : (
                        <tr>
                            <th>Date Filed</th>
                            <th>Grievance / Subject</th>
                            <th>Status</th>
                        </tr>
                    )}
                </thead>
                <tbody>
                    {filteredData.map((item, idx) => (
                        <tr key={idx}>
                            <td>{new Date(item.created_at).toLocaleDateString()}</td>
                            {activeTab === 'warnings' ? (
                                <>
                                    <td><strong>Official Warning</strong></td>
                                    <td>{item.reason}</td>
                                    <td><span className="status-badge warning">Issued</span></td>
                                </>
                            ) : (
                                <>
                                    <td>{item.reason}</td>
                                    <td><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status || 'Pending'}</span></td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Actions & Separation</h2>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1.25rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                    <i className="fa-solid fa-file-invoice"></i> Submit Resignation or Grievance
                </h4>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', alignItems: 'flex-end' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Action Type</label>
                        <select 
                            value={formData.actionType} 
                            onChange={e => setFormData({...formData, actionType: e.target.value})} 
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}
                        >
                            <option value="resignation">Submit Resignation Letter</option>
                            <option value="complaint">File Official Complaint / Grievance</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 2 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Details & Reasons</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Type description or comments here..." 
                            value={formData.reason}
                            onChange={e => setFormData({...formData, reason: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '44px' }}>
                        <i className="fa-solid fa-paper-plane"></i> Submit Request
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: '10px', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
                {['warnings', 'resignations', 'complaints'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', textTransform: 'capitalize' }}
                    >
                        {tab === 'warnings' && <i className="fa-solid fa-triangle-exclamation"></i>}
                        {tab === 'resignations' && <i className="fa-solid fa-door-open"></i>}
                        {tab === 'complaints' && <i className="fa-solid fa-circle-info"></i>}
                        {' '}{tab}
                    </button>
                ))}
            </div>

            <div className="table-container">
                {renderTable()}
            </div>
        </section>
    );
};

export default Offboarding;

import React, { useState, useEffect } from 'react';
import { get, post, API_BASE } from '../../../services/api';

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
            const uploadData = new FormData();
            uploadData.append('action_type', formData.actionType);
            uploadData.append('reason', formData.reason);
            if (formData.file) {
                uploadData.append('file', formData.file);
            }

            await post('/employee/offboardings/', uploadData);
            alert('Request submitted successfully!');
            setFormData({ actionType: 'resignation', reason: '', file: null });
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
                            <th>Date Issued</th>
                            <th>Warning Title</th>
                            <th>Reason / Remarks</th>
                            <th>Document</th>
                            <th>Status</th>
                        </tr>
                    ) : activeTab === 'resignations' ? (
                        <tr>
                            <th>Date Filed</th>
                            <th>Resignation Request</th>
                            <th>Statement / Comments</th>
                            <th>Document Attachment</th>
                            <th>Status</th>
                        </tr>
                    ) : (
                        <tr>
                            <th>Date Filed</th>
                            <th>Grievance Summary</th>
                            <th>Complaint Description</th>
                            <th>Document Supporting</th>
                            <th>Status</th>
                        </tr>
                    )}
                </thead>
                <tbody>
                    {filteredData.map((item, idx) => {
                        const fileUrl = item.file ? (item.file.startsWith('http') ? `${API_BASE}/download-file/?url=${encodeURIComponent(item.file)}&name=${encodeURIComponent(item.action_type)}` : item.file) : null;
                        return (
                            <tr key={idx}>
                                <td>{new Date(item.created_at).toLocaleDateString()}</td>
                                {activeTab === 'warnings' ? (
                                    <>
                                        <td><strong>Official Warning</strong></td>
                                        <td>{item.reason}</td>
                                        <td>
                                            {fileUrl ? (
                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>
                                                    <i className="fa-solid fa-file-pdf"></i> View Letter
                                                </a>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>No Document</span>
                                            )}
                                        </td>
                                        <td><span className="status-badge warning">Issued</span></td>
                                    </>
                                ) : activeTab === 'resignations' ? (
                                    <>
                                        <td><strong>Resignation Letter</strong></td>
                                        <td>{item.reason}</td>
                                        <td>
                                            {fileUrl ? (
                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>
                                                    <i className="fa-solid fa-file-pdf"></i> View Letter
                                                </a>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>No Document</span>
                                            )}
                                        </td>
                                        <td><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status || 'Pending'}</span></td>
                                    </>
                                ) : (
                                    <>
                                        <td><strong>Grievance Filed</strong></td>
                                        <td>{item.reason}</td>
                                        <td>
                                            {fileUrl ? (
                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>
                                                    <i className="fa-solid fa-file-pdf"></i> View Attachment
                                                </a>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>No Document</span>
                                            )}
                                        </td>
                                        <td><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status || 'Pending'}</span></td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
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
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Attach PDF/Doc (Optional)</label>
                        <input 
                            type="file" 
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={e => setFormData({...formData, file: e.target.files[0]})}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}
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

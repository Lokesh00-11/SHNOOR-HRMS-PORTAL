import React, { useState, useEffect } from 'react';
import { get, API_BASE } from '../../../services/api';

const Offboarding = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subtab, setSubtab] = useState('warnings'); // 'warnings' | 'resignations' | 'complaints'

    // Form inputs
    const [actionType, setActionType] = useState('resignation');
    const [reason, setReason] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchOffboarding = async () => {
        try {
            setLoading(true);
            const data = await get('/employee/offboardings/');
            setRecords(data || []);
        } catch (err) {
            console.error('Error fetching offboarding details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffboarding();
    }, []);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            alert('Please explain the request details.');
            return;
        }

        try {
            setSubmitting(true);
            const uploadData = new FormData();
            uploadData.append('action_type', actionType);
            uploadData.append('reason', reason);
            if (attachment) {
                uploadData.append('file', attachment);
            }

            const token = localStorage.getItem('token');
            const headers = {};
            if (token) headers['Authorization'] = `Token ${token}`;

            const res = await fetch(`${API_BASE}/employee/offboardings/`, {
                method: 'POST',
                headers,
                body: uploadData
            });

            if (res.ok) {
                alert('Request submitted successfully directly to Google Drive!');
                setReason('');
                setAttachment(null);
                // Clear input file element
                const fileEl = document.getElementById('offboardFileField');
                if (fileEl) fileEl.value = '';
                fetchOffboarding();
            } else {
                const errData = await res.json();
                alert(`Submission failed: ${errData.message || 'Server error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error submitting offboarding/grievance request.');
        } finally {
            setSubmitting(false);
        }
    };

    const getFilteredRecords = () => {
        if (subtab === 'warnings') {
            return records.filter(r => r.action_type === 'warning');
        } else if (subtab === 'resignations') {
            return records.filter(r => r.action_type === 'resignation');
        } else {
            return records.filter(r => r.action_type === 'complaint');
        }
    };

    const filteredRecords = getFilteredRecords();

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Actions & Separation</h2>

            <div className="dual-panel" style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '2rem' }}>
                {/* Left Panel - Records Stream */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 600 }}>Records History</h3>
                    
                    {/* Subtab selection headers */}
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                        <button 
                            className={`btn ${subtab === 'warnings' ? 'btn-primary active' : 'btn-ghost'}`}
                            onClick={() => setSubtab('warnings')}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                            Warnings
                        </button>
                        <button 
                            className={`btn ${subtab === 'resignations' ? 'btn-primary active' : 'btn-ghost'}`}
                            onClick={() => setSubtab('resignations')}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                            Resignations
                        </button>
                        <button 
                            className={`btn ${subtab === 'complaints' ? 'btn-primary active' : 'btn-ghost'}`}
                            onClick={() => setSubtab('complaints')}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                            Grievances
                        </button>
                    </div>

                    {/* Table list */}
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Subject / Category</th>
                                    <th>Submission Date</th>
                                    <th>Reason / Remarks</th>
                                    <th style={{ textAlign: 'right' }}>Attachment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading details...</td></tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                            {subtab === 'warnings' ? 'No warning letters issued. Congratulations!' : 
                                             subtab === 'resignations' ? 'No resignation requests submitted.' : 
                                             'No complaints or grievance requests filed.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((r, index) => {
                                        const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : '-';
                                        const title = `${subtab === 'warnings' ? 'Warning' : subtab === 'resignations' ? 'Resignation' : 'Complaint'}_Letter_${(r.employee_name || 'TL').replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}`;
                                        const downloadUrl = r.file ? `${API_BASE}/download-file/?url=${encodeURIComponent(r.file)}&name=${encodeURIComponent(title)}` : '#';
                                        return (
                                            <tr key={r.id || index}>
                                                <td style={{ fontWeight: 600 }}>
                                                    {subtab === 'warnings' ? 'Warning Corrective' : 
                                                     subtab === 'resignations' ? 'Resignation Process' : 
                                                     'Grievance Filed'}
                                                </td>
                                                <td>{date}</td>
                                                <td style={{ maxWidth: '220px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={r.reason}>
                                                    {r.reason}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {r.file ? (
                                                        <a href={downloadUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
                                                            <i className="fa-solid fa-file-pdf"></i> View
                                                        </a>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>None</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Panel - Request Filing Form */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 600 }}>Submit Official Request</h3>
                    <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Action Type</label>
                            <select 
                                value={actionType}
                                onChange={(e) => setActionType(e.target.value)}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            >
                                <option value="resignation">Resignation Request</option>
                                <option value="complaint">File Grievance / Complaint</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Detailed Reason / Justification</label>
                            <textarea 
                                rows="5"
                                required
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Explain details extensively here..."
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'none' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Supporting Attachment (Optional)</label>
                            <input 
                                id="offboardFileField"
                                type="file" 
                                onChange={(e) => setAttachment(e.target.files[0])}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '0.5rem' }}>
                            {submitting ? 'Submitting request...' : 'File Official Request'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Offboarding;

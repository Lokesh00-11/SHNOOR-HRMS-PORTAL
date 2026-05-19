import React, { useState, useEffect } from 'react';
import { get, API_BASE } from '../../../services/api';

const parseCustomDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return null;
    
    const parts = dateStr.split(' ');
    const dateParts = parts[0].split('-');
    
    if (dateParts.length !== 3) return new Date(dateStr);
    
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    
    if (parts.length > 1) {
        const timeParts = parts[1].split(':');
        const hour = parseInt(timeParts[0], 10);
        const minute = parseInt(timeParts[1], 10);
        const second = parseInt(timeParts[2], 10) || 0;
        return new Date(year, month, day, hour, minute, second);
    }
    
    return new Date(year, month, day);
};

const Offboarding = () => {
    const [offboardingList, setOffboardingList] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('warning');

    // Create Form State
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        employee: '',
        action_type: 'warning',
        reason: ''
    });
    const [attachedFile, setAttachedFile] = useState(null);

    const fetchDataInit = async () => {
        try {
            setLoading(true);
            const [offboardData, empsData] = await Promise.all([
                get('/manager/offboardings/'),
                get('/manager/employees/')
            ]);
            setOffboardingList(offboardData || []);
            setEmployees(empsData || []);
        } catch (err) {
            console.error('Error fetching offboarding resources:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDataInit();
    }, []);

    const handleCreateRecord = async (e) => {
        e.preventDefault();
        if (!formData.employee) {
            alert('Please select an employee.');
            return;
        }

        const uploadData = new FormData();
        uploadData.append('employee', formData.employee);
        uploadData.append('action_type', formData.action_type);
        uploadData.append('reason', formData.reason);
        if (attachedFile) {
            uploadData.append('file', attachedFile);
        }

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Token ${token}`;

        try {
            const res = await fetch(`${API_BASE}/manager/offboardings/`, {
                method: 'POST',
                headers,
                body: uploadData
            });

            if (res.ok) {
                alert('Offboarding record submitted and uploaded successfully!');
                setFormData({
                    employee: '',
                    action_type: 'warning',
                    reason: ''
                });
                setAttachedFile(null);
                setShowCreateForm(false);
                fetchDataInit();
            } else {
                const errData = await res.json();
                alert(`Submission failed: ${errData.message || 'Server error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error creating offboarding record.');
        }
    };

    const handleDeleteRecord = async (id) => {
        if (!confirm('Are you sure you want to delete this offboarding/action record permanently?')) return;

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Token ${token}`;

        try {
            const res = await fetch(`${API_BASE}/manager/offboardings/${id}/`, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                alert('Record deleted successfully.');
                fetchDataInit();
            } else {
                alert('Failed to delete record.');
            }
        } catch (err) {
            console.error(err);
            alert('Error occurred during deletion.');
        }
    };

    const filteredRecords = offboardingList.filter(o => o.action_type === activeTab);

    const getTabConfig = () => {
        switch (activeTab) {
            case 'warning':
                return {
                    label: 'Warning Letters',
                    colHeaders: ['Employee', 'Infraction Date', 'Reason / Infraction details', 'Letter/Doc'],
                    docLabel: 'View Letter'
                };
            case 'resignation':
                return {
                    label: 'Resignations',
                    colHeaders: ['Employee', 'Submission Date', 'Resignation Reason', 'Document'],
                    docLabel: 'View Letter'
                };
            case 'termination':
                return {
                    label: 'Terminations',
                    colHeaders: ['Employee', 'Termination Date', 'Termination Clause / Reason', 'Separation Doc'],
                    docLabel: 'View Separation'
                };
            case 'complaint':
                return {
                    label: 'Complaints & Grievances',
                    colHeaders: ['Employee Related', 'Grievance Date', 'Complaint Summary', 'Investigation Doc'],
                    docLabel: 'View File'
                };
            default:
                return { label: '', colHeaders: [], docLabel: '' };
        }
    };

    const config = getTabConfig();

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">Separation & Offboarding</h2>
                <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
                    {showCreateForm ? 'Cancel' : 'Log Separation Action'}
                </button>
            </div>

            {showCreateForm && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1.25rem' }}>Log Action Record</h4>
                    <form onSubmit={handleCreateRecord} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Target Employee</label>
                            <select 
                                required
                                value={formData.employee}
                                onChange={(e) => setFormData({...formData, employee: e.target.value})}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            >
                                <option value="">-- Choose Employee --</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name} ({emp.designation || 'Staff'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Action Type</label>
                            <select 
                                value={formData.action_type}
                                onChange={(e) => setFormData({...formData, action_type: e.target.value})}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            >
                                <option value="warning">Warning Letter</option>
                                <option value="resignation">Resignation Request</option>
                                <option value="termination">Termination Checklist</option>
                                <option value="complaint">Official Grievance Complaint</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Attach Document (PDF)</label>
                            <input 
                                type="file" 
                                accept="application/pdf"
                                onChange={(e) => setAttachedFile(e.target.files[0])}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Grievance Reason / Specific Clauses</label>
                            <input 
                                type="text"
                                required
                                value={formData.reason}
                                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                placeholder="Enter specific clauses or remarks..."
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 2rem' }}>Log Separation Record</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Subtabs selectors */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                {[
                    { key: 'warning', label: 'Warnings Issued' },
                    { key: 'resignation', label: 'Resignations Log' },
                    { key: 'termination', label: 'Terminations Separation' },
                    { key: 'complaint', label: 'Complaints Directory' }
                ].map(tab => (
                    <button 
                        key={tab.key}
                        className={`btn ${activeTab === tab.key ? 'btn-primary active' : 'btn-ghost'}`}
                        onClick={() => setActiveTab(tab.key)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            {config.colHeaders.map((col, idx) => (
                                <th key={idx}>{col}</th>
                            ))}
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={config.colHeaders.length + 1} style={{ textAlign: 'center' }}>Loading offboarding records...</td></tr>
                        ) : filteredRecords.length === 0 ? (
                            <tr><td colSpan={config.colHeaders.length + 1} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>No {config.label.toLowerCase()} found.</td></tr>
                        ) : (
                            filteredRecords.map((item, index) => {
                                let docDate = '-';
                                if (item.created_at) {
                                    const parsedDate = parseCustomDate(item.created_at);
                                    if (parsedDate && !isNaN(parsedDate.getTime())) {
                                        docDate = parsedDate.toLocaleDateString();
                                    }
                                }
                                const fileUrl = item.file ? (item.file.startsWith('http') ? `${API_BASE}/download-file/?url=${encodeURIComponent(item.file)}&name=${encodeURIComponent(item.employee_name || 'offboard')}` : item.file) : null;
                                return (
                                    <tr key={item.id || index}>
                                        <td style={{ fontWeight: 600 }}>{item.employee_name || 'Staff Member'}</td>
                                        <td>{docDate}</td>
                                        <td>{item.reason}</td>
                                        <td>
                                            {fileUrl ? (
                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>
                                                    <i className="fa-solid fa-file-pdf"></i> {config.docLabel}
                                                </a>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>No Document</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button onClick={() => handleDeleteRecord(item.id)} className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#f43f5e', borderColor: 'rgba(244,63,94,0.1)' }}>
                                                <i className="fa-solid fa-trash"></i> Delete
                                            </button>
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

export default Offboarding;

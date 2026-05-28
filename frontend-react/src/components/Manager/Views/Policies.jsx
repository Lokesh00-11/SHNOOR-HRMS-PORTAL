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

const Policies = ({ currentMode }) => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [locationFilter, setLocationFilter] = useState('ALL');

    const [showUploadForm, setShowUploadForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: 'General',
        location: 'All Offices',
        summary: ''
    });
    const [policyFile, setPolicyFile] = useState(null);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const data = await get('/policies/');
            setPolicies(data || []);
        } catch (err) {
            console.error('Error fetching policies:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const parsePolicyDesc = (descRaw) => {
        let desc = descRaw || '';
        let category = 'General';
        let location = 'All Offices';

        if (desc.startsWith('[Category:')) {
            const catMatch = desc.match(/\[Category:([^\]]+)\]/);
            const locMatch = desc.match(/\[Location:([^\]]+)\]/);
            if (catMatch) category = catMatch[1];
            if (locMatch) location = locMatch[1];
            desc = desc.replace(/\[Category:[^\]]+\]/, '').replace(/\[Location:[^\]]+\]/, '').trim();
        }
        return { desc, category, location };
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!policyFile) {
            alert('Please select a valid PDF file.');
            return;
        }

        const formattedDesc = `[Category:${formData.category}][Location:${formData.location}] ${formData.summary}`;
        const uploadData = new FormData();
        uploadData.append('title', formData.title);
        uploadData.append('description', formattedDesc);
        uploadData.append('file', policyFile);

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Token ${token}`;

        try {
            const res = await fetch(`${API_BASE}/policies/create/`, {
                method: 'POST',
                headers,
                body: uploadData
            });

            if (res.ok) {
                alert('Policy published successfully to Google Drive!');
                setFormData({
                    title: '',
                    category: 'General',
                    location: 'All Offices',
                    summary: ''
                });
                setPolicyFile(null);
                setShowUploadForm(false);
                fetchPolicies();
            } else {
                const errData = await res.json();
                alert(`Upload failed: ${errData.message || 'Server error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('An unexpected error occurred during publishing.');
        }
    };

    const handleDeletePolicy = async (id) => {
        if (!confirm('Are you sure you want to permanently delete this corporate policy?')) return;

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Token ${token}`;

        try {
            const res = await fetch(`${API_BASE}/policies/delete/${id}/`, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                alert('Policy deleted successfully!');
                fetchPolicies();
            } else {
                alert('Failed to delete policy.');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during deletion.');
        }
    };

    const parsedPolicies = policies.map(p => {
        const parsed = parsePolicyDesc(p.description);
        return {
            ...p,
            desc: parsed.desc,
            category: parsed.category,
            location: parsed.location
        };
    });

    const filteredPolicies = parsedPolicies.filter(p => {
        const matchQuery = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
        const matchLoc = locationFilter === 'ALL' || p.location === locationFilter;
        return matchQuery && matchCat && matchLoc;
    });

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">Corporate Policies</h2>
                {currentMode === 'manager' && (
                    <button className="btn btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
                        {showUploadForm ? 'Cancel' : 'Upload Policy'}
                    </button>
                )}
            </div>

            {showUploadForm && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1.25rem' }}>Publish Corporate Policy</h4>
                    <form onSubmit={handleUploadSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Document Title</label>
                            <input 
                                type="text" 
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="Enter policy title"
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Category</label>
                            <select 
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            >
                                <option value="General">General</option>
                                <option value="IT Security">IT Security</option>
                                <option value="HR Code">HR Code</option>
                                <option value="Finance">Finance</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Target Office Location</label>
                            <select 
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            >
                                <option value="All Offices">All Offices</option>
                                <option value="Bangalore HQ">Bangalore HQ</option>
                                <option value="Mumbai Branch">Mumbai Branch</option>
                                <option value="Remote Workforce">Remote Workforce</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Policy PDF Document</label>
                            <input 
                                type="file" 
                                required
                                accept="application/pdf"
                                onChange={(e) => setPolicyFile(e.target.files[0])}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Description Summary</label>
                            <input 
                                type="text"
                                required
                                value={formData.summary}
                                onChange={(e) => setFormData({...formData, summary: e.target.value})}
                                placeholder="Enter description summary..."
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 2rem' }}>Publish to Drive</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                    type="text" 
                    placeholder="Search policies..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 2, minWidth: '200px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Category:</span>
                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    >
                        <option value="ALL">All</option>
                        <option value="General">General</option>
                        <option value="IT Security">IT Security</option>
                        <option value="HR Code">HR Code</option>
                        <option value="Finance">Finance</option>
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Location:</span>
                    <select 
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    >
                        <option value="ALL">All</option>
                        <option value="All Offices">All Offices</option>
                        <option value="Bangalore HQ">Bangalore HQ</option>
                        <option value="Mumbai Branch">Mumbai Mumbai</option>
                        <option value="Remote Workforce">Remote Workforce</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Document Title</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Office location</th>
                            <th>Published Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading policies...</td></tr>
                        ) : filteredPolicies.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No policies published yet.</td></tr>
                        ) : (
                            filteredPolicies.map((policy, index) => {
                                const downloadUrl = policy.file ? (policy.file.startsWith('http') ? `${API_BASE}/download-file/?url=${encodeURIComponent(policy.file)}&name=${encodeURIComponent(policy.title)}` : policy.file) : '#';
                                return (
                                    <tr key={policy.id || index}>
                                        <td style={{ fontWeight: 600 }}>{policy.title}</td>
                                        <td>{policy.desc || 'No description'}</td>
                                        <td>
                                            <span className="status-badge" style={{ background: 'rgba(30,58,138,0.1)', color: 'var(--primary-color)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                {policy.category}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="status-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                {policy.location}
                                            </span>
                                        </td>
                                        <td>{(() => {
                                            if (!policy.created_at) return '-';
                                            const parsedDate = parseCustomDate(policy.created_at);
                                            return parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : '-';
                                        })()}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <i className="fa-solid fa-eye"></i> View
                                                </a>
                                                {currentMode === 'manager' && (
                                                    <button className="btn btn-ghost" onClick={() => handleDeletePolicy(policy.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: '#f43f5e', borderColor: 'rgba(244,63,94,0.15)' }}>
                                                        <i className="fa-solid fa-trash-can"></i> Delete
                                                    </button>
                                                )}
                                            </div>
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

export default Policies;

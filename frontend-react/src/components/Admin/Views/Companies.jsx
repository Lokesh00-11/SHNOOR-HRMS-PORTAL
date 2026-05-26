import React, { useState, useEffect } from 'react';
import { get, post, patch, del } from '../../../services/api';

const Companies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCompany, setNewCompany] = useState({ name: '', email: '', password: '' });
    const [submitLoading, setSubmitLoading] = useState(false);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const data = await get('/admin/companies/');
            setCompanies(data);
        } catch (err) {
            console.error('Error loading companies:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleAddCompany = async (e) => {
        e.preventDefault();
        try {
            setSubmitLoading(true);
            await post('/admin/companies/create/', { 
                name: newCompany.name, 
                email: newCompany.email, 
                password: newCompany.password,
                is_active: true 
            });
            setNewCompany({ name: '', email: '', password: '' });
            await fetchCompanies();
        } catch (err) {
            console.error('Error adding company:', err);
            alert(err.message || 'Failed to add company.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const toggleCompanyStatus = async (id, currentStatus) => {
        try {
            await patch(`/admin/companies/${id}/`, { is_active: !currentStatus });
            await fetchCompanies();
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update company status');
        }
    };

    const deleteCompany = async (id) => {
        if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) return;
        try {
            await del(`/admin/companies/${id}/`);
            await fetchCompanies();
        } catch (err) {
            console.error('Error deleting company:', err);
            alert('Failed to delete company');
        }
    };

    const extendCompanyLicense = async (id, currentExpiry) => {
        const monthsStr = window.prompt("Enter number of months to extend the subscription license:", "1");
        if (monthsStr === null) return;
        const months = parseInt(monthsStr);
        if (isNaN(months) || months <= 0) {
            alert("Please enter a valid number of months.");
            return;
        }

        try {
            let baseDate = new Date();
            if (currentExpiry) {
                const currentExpiryDate = new Date(currentExpiry);
                if (currentExpiryDate > baseDate) {
                    baseDate = currentExpiryDate;
                }
            }
            baseDate.setMonth(baseDate.getMonth() + months);
            const formattedDate = baseDate.toISOString().split('T')[0];

            await patch(`/admin/companies/${id}/`, {
                license_expiry_date: formattedDate,
                license_expired: false,
                is_active: true
            });
            alert(`Extended successfully! New expiry date: ${formattedDate}`);
            await fetchCompanies();
        } catch (err) {
            console.error('Failed to extend license:', err);
            alert('Failed to extend license.');
        }
    };

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Registered Companies</h2>
            
            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Add New Company</h4>
                <form onSubmit={handleAddCompany} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="setting-item" style={{ flex: 1, minWidth: '200px' }}>
                        <h4>Company Name</h4>
                        <input 
                            type="text" 
                            required 
                            value={newCompany.name}
                            onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                            placeholder="e.g. Acme Corp"
                        />
                    </div>
                    <div className="setting-item" style={{ flex: 1, minWidth: '200px' }}>
                        <h4>Email Address</h4>
                        <input 
                            type="email" 
                            required 
                            value={newCompany.email}
                            onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                            placeholder="admin@acme.com"
                        />
                    </div>
                    <div className="setting-item" style={{ flex: 1, minWidth: '200px' }}>
                        <h4>Admin Password</h4>
                        <input 
                            type="password" 
                            required 
                            value={newCompany.password}
                            onChange={(e) => setNewCompany({...newCompany, password: e.target.value})}
                            placeholder="Set initial password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '45px', padding: '0 2rem' }} disabled={submitLoading}>
                        {submitLoading ? 'Adding...' : 'Add Company'}
                    </button>
                </form>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Company Name</th>
                            <th>Email Address</th>
                            <th>Total Users</th>
                            <th>License Purchase Date</th>
                            <th>Expiry Date</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center' }}>Loading companies...</td>
                            </tr>
                        ) : companies.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center' }}>No companies found.</td>
                            </tr>
                        ) : (
                            companies.map(company => (
                                <tr key={company.id}>
                                    <td style={{ fontWeight: 600 }}>{company.name}</td>
                                    <td>{company.email}</td>
                                    <td>{company.members_count || 0}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>
                                        {company.created_at ? company.created_at.split(' ')[0] : 'N/A'}
                                    </td>
                                    <td style={{ 
                                        fontWeight: 600, 
                                        color: company.license_expired ? 'var(--danger-color)' : 'var(--text-main)'
                                    }}>
                                        {company.license_expiry_date ? (
                                            <span>
                                                {company.license_expiry_date}
                                                {company.license_expired && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--danger-color)' }}>(Expired)</span>}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>No License</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status ${company.is_active ? 'active' : 'inactive'}`}>
                                            {company.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button 
                                                className="btn btn-ghost" 
                                                style={{ padding: '0.5rem', minWidth: '40px' }} 
                                                onClick={() => toggleCompanyStatus(company.id, company.is_active)}
                                                title={company.is_active ? 'Deactivate Company' : 'Activate Company'}
                                            >
                                                <i className="fa-solid fa-power-off" style={{ color: company.is_active ? 'var(--warning-color)' : 'var(--success-color)' }}></i>
                                            </button>
                                            <button 
                                                className="btn btn-ghost" 
                                                style={{ padding: '0.5rem', minWidth: '40px' }} 
                                                onClick={() => extendCompanyLicense(company.id, company.license_expiry_date)}
                                                title="Extend License / Renew Plan"
                                            >
                                                <i className="fa-solid fa-calendar-plus" style={{ color: 'var(--primary-color)' }}></i>
                                            </button>
                                            <button 
                                                className="btn btn-ghost" 
                                                style={{ padding: '0.5rem', minWidth: '40px' }} 
                                                onClick={() => deleteCompany(company.id)}
                                                title="Delete Company"
                                            >
                                                <i className="fa-solid fa-trash" style={{ color: 'var(--danger-color)' }}></i>
                                            </button>
                                        </div>
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

export default Companies;

import React, { useState, useEffect } from 'react';
import { get, patch } from '../../../services/api';

const SuperAdmin = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const currentRole = localStorage.getItem('role') || '';

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const data = await get('/admin/superadmins/');
            if (Array.isArray(data)) {
                setAdmins(data);
            } else {
                setError(data.message || "Failed to load admins");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch data.");
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (userId) => {
        if (!window.confirm("Are you sure you want to promote this admin to Super Admin?")) return;
        try {
            const data = await patch('/admin/superadmins/', { user_id: userId });
            if (data.message) {
                alert(data.message);
                fetchAdmins();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to promote admin.");
        }
    };

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Super Admin Management</h2>
            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            {currentRole === 'super_admin' && <th>Action</th>}
                        </tr>
                    </thead>            
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={currentRole === 'super_admin' ? "4" : "3"} style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : admins.length === 0 ? (
                            <tr><td colSpan={currentRole === 'super_admin' ? "4" : "3"} style={{ textAlign: 'center' }}>No admins found.</td></tr>
                        ) : (
                            admins.map(admin => (
                                <tr key={admin.id}>
                                    <td>{admin.first_name || admin.username}</td>
                                    <td>{admin.email}</td>
                                    <td>
                                        <span className={`status ${admin.role === 'super_admin' ? 'active' : ''}`} style={{ 
                                            background: admin.role === 'super_admin' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)', 
                                            color: admin.role === 'super_admin' ? '#10b981' : '#6366f1', 
                                            padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' 
                                        }}>
                                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                        </span>
                                    </td>
                                    {currentRole === 'super_admin' && (
                                        <td>
                                            {admin.role === 'admin' && (
                                                <button 
                                                    onClick={() => handlePromote(admin.id)}
                                                    style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    Make Super Admin
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default SuperAdmin;

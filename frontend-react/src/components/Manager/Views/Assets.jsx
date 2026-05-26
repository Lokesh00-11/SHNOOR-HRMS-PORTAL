import React, { useState, useEffect } from 'react';
import { get, post, patch, del } from '../../../services/api';

const Assets = ({ currentMode }) => {
    const [assets, setAssets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        asset_type: '',
        serial_number: '',
        assigned_to: '',
        status: 'available',
        purchase_date: ''
    });
    const [editingId, setEditingId] = useState(null);

    const [typeFilter, setTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    const ASSET_TYPES = [
        { type: '', name: '-- Select Asset Type --', prefix: '' },
        { type: 'Laptop', name: 'MacBook Pro 16"', prefix: 'LAP' },
        { type: 'Monitor', name: 'Dell UltraSharp 27"', prefix: 'MON' },
        { type: 'Keyboard', name: 'Keychron K2 Mechanical', prefix: 'KBD' },
        { type: 'Mouse', name: 'Logitech MX Master 3', prefix: 'MOU' },
        { type: 'Headset', name: 'Sony WH-1000XM5', prefix: 'HST' },
        { type: 'Smartphone', name: 'iPhone 15 Pro', prefix: 'MOB' },
        { type: 'Tablet', name: 'iPad Pro 11"', prefix: 'TAB' },
        { type: 'Desk Chair', name: 'Herman Miller Aeron', prefix: 'CHR' }
    ];

    const handleAssetTypeChange = (e) => {
        const type = e.target.value;
        const selected = ASSET_TYPES.find(a => a.type === type);
        if (selected && type !== '') {
            const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
            setFormData({
                ...formData,
                asset_type: selected.type,
                name: selected.name,
                serial_number: `${selected.prefix}-${randomString}`
            });
        } else {
            setFormData({
                ...formData,
                asset_type: '',
                name: '',
                serial_number: ''
            });
        }
    };

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const data = await get('/assets/');
            setAssets(data || []);
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const data = await get('/manager/all-employee-profiles/');
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    useEffect(() => {
        fetchAssets();
        if (currentMode === 'manager') {
            fetchEmployees();
        }
    }, [currentMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null
            };
            if (editingId) {
                await patch(`/assets/${editingId}/`, payload);
            } else {
                await post('/assets/', payload);
            }
            setShowModal(false);
            setFormData({ name: '', asset_type: '', serial_number: '', assigned_to: '', status: 'available', purchase_date: '' });
            setEditingId(null);
            fetchAssets();
        } catch (error) {
            console.error('Error saving asset:', error);
            alert('Failed to save asset. Check if serial number is unique.');
        }
    };

    const handleEdit = (asset) => {
        setFormData({
            name: asset.name || '',
            asset_type: asset.asset_type || '',
            serial_number: asset.serial_number || '',
            assigned_to: asset.assigned_to || '',
            status: asset.status || 'available',
            purchase_date: asset.purchase_date || ''
        });
        setEditingId(asset.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            try {
                await del(`/assets/${id}/`);
                fetchAssets();
            } catch (error) {
                console.error('Error deleting asset:', error);
                alert('Failed to delete asset.');
            }
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'available': return <span className="status-badge" style={{ background: '#10b98120', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Available</span>;
            case 'assigned': return <span className="status-badge" style={{ background: '#3b82f620', color: '#3b82f6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Assigned</span>;
            case 'maintenance': return <span className="status-badge" style={{ background: '#f59e0b20', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Maintenance</span>;
            default: return <span>{status}</span>;
        }
    };

    const safeAssets = Array.isArray(assets) ? assets : [];
    
    const filteredAssets = safeAssets.filter(a => {
        const typeMatch = typeFilter === 'All' || a.asset_type === typeFilter;
        const statusMatch = statusFilter === 'All' || a.status === statusFilter;
        return typeMatch && statusMatch;
    });

    const totalAssets = filteredAssets.length;
    const availableAssets = filteredAssets.filter(a => a.status === 'available').length;
    const assignedAssets = filteredAssets.filter(a => a.status === 'assigned').length;
    const maintenanceAssets = filteredAssets.filter(a => a.status === 'maintenance').length;

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="gradient-text">Company Assets</h2>
                {currentMode === 'manager' && (
                    <button className="btn btn-primary" onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', asset_type: '', serial_number: '', assigned_to: '', status: 'available', purchase_date: '' });
                        setShowModal(true);
                    }}>
                        <i className="fa-solid fa-plus"></i> Add Asset
                    </button>
                )}
            </div>

            {currentMode === 'manager' && !loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total Assets</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{totalAssets}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Available</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{availableAssets}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Assigned</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{assignedAssets}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Maintenance</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{maintenanceAssets}</div>
                    </div>
                </div>
            )}

            {currentMode === 'manager' && !loading && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <select 
                        value={typeFilter} 
                        onChange={(e) => setTypeFilter(e.target.value)} 
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', flex: 1 }}
                    >
                        <option value="All">All Asset Types</option>
                        {ASSET_TYPES.filter(a => a.type).map(a => (
                            <option key={a.type} value={a.type}>{a.type}</option>
                        ))}
                    </select>

                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)} 
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', flex: 1 }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="assigned">Assigned</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
            )}

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Serial Number</th>
                                {currentMode === 'manager' && <th>Assigned To</th>}
                                <th>Status</th>
                                <th>Purchase Date</th>
                                {currentMode === 'manager' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={currentMode === 'manager' ? 7 : 5} style={{ textAlign: 'center' }}>Loading assets...</td>
                                </tr>
                            ) : filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={currentMode === 'manager' ? 7 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No matching assets found.</td>
                                </tr>
                            ) : (
                                filteredAssets.map(asset => (
                                    <tr key={asset.id}>
                                        <td style={{ fontWeight: 600 }}>{asset.name}</td>
                                        <td>{asset.asset_type}</td>
                                        <td>{asset.serial_number}</td>
                                        {currentMode === 'manager' && <td>{asset.assigned_to_name || '-'}</td>}
                                        <td>{getStatusBadge(asset.status)}</td>
                                        <td>{asset.purchase_date || '-'}</td>
                                        {currentMode === 'manager' && (
                                            <td>
                                                <button className="btn btn-ghost" onClick={() => handleEdit(asset)} style={{ padding: '4px 8px', marginRight: '4px' }}>
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button className="btn btn-ghost" onClick={() => handleDelete(asset.id)} style={{ padding: '4px 8px', color: '#ef4444' }}>
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        <h3 className="gradient-text" style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Asset' : 'Add New Asset'}</h3>
                        
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Asset Type</label>
                                <select value={formData.asset_type} onChange={handleAssetTypeChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                                    {ASSET_TYPES.map(asset => (
                                        <option key={asset.type} value={asset.type}>{asset.type === '' ? asset.name : asset.type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Asset Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Serial Number</label>
                                <input type="text" value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Status</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                                    <option value="available">Available</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="maintenance">Under Maintenance</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Assigned To (Optional)</label>
                                <select value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                                    <option value="">-- Not Assigned --</option>
                                    {(Array.isArray(employees) ? employees : []).filter(emp => emp.employee_pk).map(emp => (
                                        <option key={emp.employee_pk} value={emp.employee_pk}>{emp.first_name} {emp.last_name} ({emp.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Purchase Date</label>
                                <input type="date" value={formData.purchase_date} onChange={e => setFormData({...formData, purchase_date: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Add Asset'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Assets;

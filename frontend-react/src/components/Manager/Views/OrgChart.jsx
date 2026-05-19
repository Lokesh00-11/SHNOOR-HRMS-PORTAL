import React, { useState, useEffect } from 'react';
import { get, post, del } from '../../../services/api';

const OrgChart = () => {
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Authorization check
    const userRole = (localStorage.getItem('role') || '').toLowerCase();
    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin';

    // Add Member Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        department: '',
        work_mode: 'remote',
        manager: '',
        company_name: '',
        employee_months: ''
    });

    const fetchOrgChart = async () => {
        try {
            setLoading(true);
            const data = await get('/org-chart/');
            setNodes(data || []);
        } catch (err) {
            console.error('Error fetching org chart:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgChart();
    }, []);

    const handleOpenAddModal = () => {
        setFormData({
            name: '',
            role: '',
            department: '',
            work_mode: 'remote',
            manager: '',
            company_name: '',
            employee_months: ''
        });
        setShowAddModal(true);
    };

    const handleAddNode = async (e) => {
        e.preventDefault();
        try {
            const body = {
                ...formData,
                manager: formData.manager ? parseInt(formData.manager) : null,
                employee_months: formData.employee_months ? parseInt(formData.employee_months) : null
            };
            await post('/org-chart/', body);
            alert('New member added to org chart successfully!');
            setShowAddModal(false);
            fetchOrgChart();
        } catch (err) {
            alert(err.message || 'Failed to add node to org chart.');
            console.error(err);
        }
    };

    const handleDeleteNode = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name} (#${id}) from the org chart?`)) return;
        try {
            await del(`/org-chart/${id}/`);
            alert('Node deleted successfully!');
            fetchOrgChart();
        } catch (err) {
            alert(err.message || 'Failed to delete node.');
            console.error(err);
        }
    };

    // Recursive component to render node and its children
    const TreeNode = ({ node, allNodes }) => {
        const children = allNodes.filter(item => item.manager === node.id);
        const profilePic = node.profile_picture ? (node.profile_picture.startsWith('http') ? node.profile_picture : `http://127.0.0.1:8000${node.profile_picture}`) : null;

        return (
            <li>
                <div className="tree-node" style={{ position: 'relative', paddingBottom: isManagerOrAdmin ? '1.8rem' : '1rem' }}>
                    {node.work_mode && (
                        <span className="node-mode">{node.work_mode}</span>
                    )}
                    <span style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                        #{node.id}
                    </span>
                    {profilePic ? (
                        <img src={profilePic} alt={node.name} className="node-img" />
                    ) : (
                        <div className="node-img" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <i className="fa-solid fa-user" style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}></i>
                        </div>
                    )}
                    <span className="node-name">{node.name}</span>
                    <span className="node-role">{node.role}</span>
                    <span className="node-dept">{node.department}</span>

                    {isManagerOrAdmin && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id, node.name); }}
                            style={{ 
                                position: 'absolute', 
                                bottom: '6px', 
                                right: '6px', 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#f43f5e', 
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                padding: '4px',
                                opacity: 0.7,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.transform = 'scale(1.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '0.7';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title={`Delete ${node.name}`}
                        >
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                    )}
                </div>
                {children.length > 0 && (
                    <ul>
                        {children.map(child => (
                            <TreeNode key={child.id} node={child} allNodes={allNodes} />
                        ))}
                    </ul>
                )}
            </li>
        );
    };

    const topLevelNodes = nodes.filter(node => !node.manager);

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">Corporate Hierarchy</h2>
                {isManagerOrAdmin && (
                    <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-plus"></i> Add Member Node
                    </button>
                )}
            </div>

            {/* Add Node Modal */}
            {showAddModal && (
                <div className="modal-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', borderRadius: '16px' }}>
                        <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Add Org Chart Node</h3>
                        
                        <form onSubmit={handleAddNode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Full Name *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Employee Name"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Role/Designation *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.role} 
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    placeholder="e.g. Software Engineer"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Department *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.department} 
                                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    placeholder="e.g. IT"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Work Mode</label>
                                    <select 
                                        value={formData.work_mode} 
                                        onChange={(e) => setFormData({...formData, work_mode: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    >
                                        <option value="remote">Remote</option>
                                        <option value="onsite">Onsite</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>
                                
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Reports To (Manager)</label>
                                    <select 
                                        value={formData.manager} 
                                        onChange={(e) => setFormData({...formData, manager: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    >
                                        <option value="">None (Top-Level Node)</option>
                                        {nodes.map(n => (
                                            <option key={n.id} value={n.id}>{n.name} ({n.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Company Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.company_name} 
                                        onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                                        placeholder="Shnoor"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Tenure (Months)</label>
                                    <input 
                                        type="number" 
                                        value={formData.employee_months} 
                                        onChange={(e) => setFormData({...formData, employee_months: e.target.value})}
                                        placeholder="e.g. 12"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Member</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                <div className="tree">
                    {loading ? (
                        <div style={{ color: 'var(--text-muted)' }}>Loading hierarchy...</div>
                    ) : nodes.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)' }}>No organization data found.</div>
                    ) : (
                        <ul>
                            {topLevelNodes.map(node => (
                                <TreeNode key={node.id} node={node} allNodes={nodes} />
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
};

export default OrgChart;

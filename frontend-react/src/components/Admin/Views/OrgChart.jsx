import React, { useState, useEffect } from 'react';
import { get, post, del } from '../../../services/api';

const OrgNode = ({ node, allData, onDelete }) => {
    const children = allData.filter(item => item.manager === node.id);

    return (
        <li>
            <div className="tree-node">
                {node.work_mode && (
                    <span className="node-mode">{node.work_mode}</span>
                )}
                
                <div className="node-img">
                    {node.profile_picture ? (
                        <img src={node.profile_picture} alt={node.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <i className="fa-solid fa-user"></i>
                    )}
                </div>
                
                <span className="node-id" style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                    #{node.id}
                </span>
                
                <span className="node-name">{node.name}</span>
                <span className="node-role">{node.role}</span>
                <span className="node-dept">{node.department}</span>
                
                <button 
                    className="btn btn-ghost" 
                    style={{ position: 'absolute', bottom: '8px', right: '8px', padding: '4px', fontSize: '0.8rem', color: 'var(--danger-color)', opacity: 0.4 }}
                    onClick={() => onDelete(node.id)}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '0.4'}
                    title="Delete Node"
                >
                    <i className="fa-solid fa-trash"></i>
                </button>
            </div>
            
            {children.length > 0 && (
                <ul>
                    {children.map(child => (
                        <OrgNode key={child.id} node={child} allData={allData} onDelete={onDelete} />
                    ))}
                </ul>
            )}
        </li>
    );
};

const OrgChart = () => {
    const [orgData, setOrgData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '', role: '', department: '', company_name: '', employee_months: '', work_mode: 'remote', manager: ''
    });

    const fetchOrgChart = async () => {
        try {
            setLoading(true);
            const data = await get('/org-chart/');
            setOrgData(data || []);
        } catch (err) {
            console.error('Error loading org chart:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgChart();
    }, []);

    const handleAddNode = async (e) => {
        e.preventDefault();
        try {
            setSubmitLoading(true);
            const payload = {
                ...formData,
                employee_months: parseInt(formData.employee_months) || 0,
                manager: formData.manager.trim() ? parseInt(formData.manager.trim()) : null
            };
            
            await post('/org-chart/', payload);
            setFormData({ name: '', role: '', department: '', company_name: '', employee_months: '', work_mode: 'remote', manager: '' });
            await fetchOrgChart();
        } catch (err) {
            console.error('Error adding node:', err);
            alert('Error adding node');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteNode = async (id) => {
        if (!window.confirm('Delete this node from org chart?')) return;
        try {
            await del(`/org-chart/${id}/`);
            await fetchOrgChart();
        } catch (err) {
            console.error('Error deleting node:', err);
            alert('Error deleting node');
        }
    };

    const topLevelNodes = orgData.filter(node => !node.manager);

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Organization Chart</h2>
            
            <div className="glass-panel" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
                <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Add Member to Hierarchy</h4>
                <form onSubmit={handleAddNode} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
                    <div className="setting-item">
                        <h4>Full Name</h4>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                    </div>
                    <div className="setting-item">
                        <h4>Role / Designation</h4>
                        <input type="text" required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} placeholder="e.g. CEO" />
                    </div>
                    <div className="setting-item">
                        <h4>Department</h4>
                        <input type="text" required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} placeholder="e.g. Management" />
                    </div>
                    <div className="setting-item">
                        <h4>Company</h4>
                        <input type="text" required value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} placeholder="e.g. Shnoor" />
                    </div>
                    <div className="setting-item">
                        <h4>Tenure (Months)</h4>
                        <input type="number" required value={formData.employee_months} onChange={(e) => setFormData({...formData, employee_months: e.target.value})} />
                    </div>
                    <div className="setting-item">
                        <h4>Work Mode</h4>
                        <select value={formData.work_mode} onChange={(e) => setFormData({...formData, work_mode: e.target.value})}>
                            <option value="onsite">Onsite</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="remote">Remote</option>
                        </select>
                    </div>
                    <div className="setting-item">
                        <h4>Reports To (Manager ID)</h4>
                        <input type="number" value={formData.manager} onChange={(e) => setFormData({...formData, manager: e.target.value})} placeholder="Root node if empty" />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '45px' }} disabled={submitLoading}>
                        {submitLoading ? 'Adding...' : 'Add Member'}
                    </button>
                </form>
            </div>

            <div className="org-chart-container">
                {loading ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading hierarchy...</div>
                ) : orgData.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No organization data found. Start by adding a root node.</div>
                ) : (
                    <div className="tree">
                        <ul>
                            {topLevelNodes.map(node => (
                                <OrgNode key={node.id} node={node} allData={orgData} onDelete={handleDeleteNode} />
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
};

export default OrgChart;

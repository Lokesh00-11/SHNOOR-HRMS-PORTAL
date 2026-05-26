import React, { useState, useEffect } from 'react';
import { get, post, put } from '../../../services/api';

const Cases = () => {
    const [cases, setCases] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    // Form state
    const [employeeIds, setEmployeeIds] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [caseType, setCaseType] = useState('Disciplinary');
    const [severity, setSeverity] = useState('low');

    // Action state
    const [updatingId, setUpdatingId] = useState(null);

    const fetchCases = async () => {
        try {
            setLoading(true);
            const casesData = await get('/teamleader/cases/');
            setCases(casesData || []);
            const membersData = await get('/teamleader/team-members/');
            setTeamMembers(membersData || []);
        } catch (err) {
            console.error('Error fetching cases:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCases();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (employeeIds.length === 0) {
            alert('Please select at least one employee.');
            return;
        }
        
        try {
            setFormLoading(true);
            await post('/teamleader/cases/', {
                employee_ids: employeeIds,
                title,
                description,
                case_type: caseType,
                severity
            });
            setShowModal(false);
            setEmployeeIds([]);
            setTitle('');
            setDescription('');
            fetchCases();
        } catch (err) {
            alert('Failed to create case: ' + (err.message || 'Server error'));
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateStatus = async (caseId, newStatus) => {
        try {
            setUpdatingId(caseId);
            await put('/teamleader/cases/', {
                id: caseId,
                status: newStatus
            });
            fetchCases();
        } catch (err) {
            alert('Failed to update case: ' + (err.message || 'Server error'));
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <section className="view-section active" style={{ background: 'var(--bg-card, #ffffff)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Cases</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <i className="fa-solid fa-plus"></i> Create New Case
                </button>
            </div>

            <div className="table-container" style={{ background: 'var(--bg-card, #ffffff)' }}>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Involved Employees</th>
                            <th>Type</th>
                            <th>Severity</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading cases...</td></tr>
                        ) : cases.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No cases found.</td></tr>
                        ) : (
                            cases.map(c => {
                                let severityColor = 'var(--text-main)';
                                if (c.severity === 'critical') severityColor = '#ef4444';
                                else if (c.severity === 'high') severityColor = '#f59e0b';
                                else if (c.severity === 'low') severityColor = '#10b981';

                                return (
                                    <tr key={c.id}>
                                        <td>#{c.id}</td>
                                        <td style={{ fontWeight: 500 }}>{c.title}</td>
                                        <td>{c.employee_names || 'None'}</td>
                                        <td>{c.case_type}</td>
                                        <td>
                                            <span style={{ 
                                                color: severityColor,
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                textTransform: 'uppercase'
                                            }}>
                                                {c.severity}
                                            </span>
                                        </td>
                                        <td>
                                            <select 
                                                value={c.status}
                                                onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                                                disabled={updatingId === c.id}
                                                style={{ 
                                                    padding: '0.5rem 1rem', 
                                                    borderRadius: '8px', 
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-main)',
                                                    outline: 'none',
                                                    cursor: 'pointer',
                                                    fontWeight: '500',
                                                    appearance: 'none',
                                                    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'right 0.7rem top 50%',
                                                    backgroundSize: '0.65rem auto',
                                                    paddingRight: '2.5rem'
                                                }}
                                            >
                                                <option value="open">Open</option>
                                                <option value="investigating">Under Investigation</option>
                                                <option value="escalated">Escalated to Manager</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-ghost"
                                                onClick={() => alert(`Case Description:\n\n${c.description}`)}
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 className="gradient-text" style={{ margin: 0 }}>Create New Case</h3>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ fontSize: '1.25rem', padding: '0.25rem', position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Involved Employees</label>
                                <div style={{ 
                                    width: '100%', padding: '0.75rem', borderRadius: '8px', 
                                    border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', 
                                    color: 'var(--text-main)', maxHeight: '150px', overflowY: 'auto',
                                    display: 'flex', flexDirection: 'column', gap: '8px'
                                }}>
                                    {teamMembers.length === 0 ? (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No team members found</div>
                                    ) : (
                                        teamMembers.map(m => (
                                            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={employeeIds.includes(m.id.toString()) || employeeIds.includes(m.id)}
                                                    onChange={() => {
                                                        const id = m.id;
                                                        setEmployeeIds(prev => 
                                                            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                                        );
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                {m.full_name || m.first_name || m.username || 'Unknown Employee'}
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Case Title</label>
                                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g. Repeated Tardiness" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Case Type</label>
                                    <select value={caseType} onChange={e => setCaseType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                                        <option value="Disciplinary" style={{ color: '#000' }}>Disciplinary</option>
                                        <option value="Grievance" style={{ color: '#000' }}>Grievance</option>
                                        <option value="Performance" style={{ color: '#000' }}>Performance (PIP)</option>
                                        <option value="Payroll" style={{ color: '#000' }}>Payroll Dispute</option>
                                        <option value="IT/Equipment" style={{ color: '#000' }}>IT/Equipment</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Severity</label>
                                    <select value={severity} onChange={e => setSeverity(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                                        <option value="low" style={{ color: '#000' }}>Low</option>
                                        <option value="medium" style={{ color: '#000' }}>Medium</option>
                                        <option value="high" style={{ color: '#000' }}>High</option>
                                        <option value="critical" style={{ color: '#000' }}>Critical</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Description & Details</label>
                                <textarea required rows="4" value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide full details of the incident..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'vertical', fontFamily: 'Arial, sans-serif' }}></textarea>
                            </div>
                            
                            <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ marginTop: '1rem', width: '100%' }}>
                                {formLoading ? 'Submitting Case...' : 'Submit Case'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Cases;

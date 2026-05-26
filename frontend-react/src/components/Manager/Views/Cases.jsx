import React, { useState, useEffect } from 'react';
import { get, put } from '../../../services/api';

const Cases = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchCases = async () => {
        try {
            setLoading(true);
            const casesData = await get('/manager/cases/');
            setCases(casesData || []);
        } catch (err) {
            console.error('Error fetching cases:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCases();
    }, []);

    const handleUpdateStatus = async (caseId, newStatus) => {
        try {
            setUpdatingId(caseId);
            await put('/manager/cases/', {
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
                <h2 className="gradient-text" style={{ margin: 0 }}>Escalated Cases</h2>
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
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No escalated cases found.</td></tr>
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
                                                <option value="escalated">Escalated to Manager</option>
                                                <option value="investigating">Under Investigation</option>
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
        </section>
    );
};

export default Cases;

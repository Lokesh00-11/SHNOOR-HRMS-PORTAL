import React from 'react';

const ExpenseFinancePanel = ({ teamExpenses, stats, loading }) => {
    return (
        <div className="fade-in">
            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', marginBottom: '2rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Team Expenses</span>
                <h3 style={{ fontSize: '1.5rem', margin: '0.25rem 0 0', fontWeight: 700 }}>
                    ₹{stats.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Operational Expenses</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Submitted Date</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Aggregating operational finance data...</td></tr>
                            ) : teamExpenses.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No expense data available for this team.</td></tr>
                            ) : (
                                teamExpenses.map((exp, index) => {
                                    const statusLower = (exp.status || '').toLowerCase();
                                    const statusClass = statusLower === 'approved' ? 'active' : statusLower === 'rejected' ? 'danger' : 'pending';
                                    const fileUrl = exp.receipt ? (exp.receipt.startsWith('http') ? exp.receipt : `http://127.0.0.1:8000${exp.receipt}`) : null;
                                    return (
                                        <tr key={exp.id || index}>
                                            <td style={{ fontWeight: 600 }}>{exp.employee_name}</td>
                                            <td>{exp.submitted_at_str || '-'}</td>
                                            <td>{exp.category}</td>
                                            <td style={{ fontWeight: 600 }}>
                                                ₹{parseFloat(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${statusClass}`}>
                                                    {exp.status}
                                                </span>
                                            </td>
                                            <td>
                                                {fileUrl ? (
                                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500, marginRight: '0.5rem' }}>
                                                        View
                                                    </a>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>N/A</span>
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
        </div>
    );
};

export default ExpenseFinancePanel;

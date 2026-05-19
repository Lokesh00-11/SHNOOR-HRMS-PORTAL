import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({ search: '', status: 'ALL', payment: 'ALL', startDate: '', endDate: '' });
    const [formData, setFormData] = useState({ title: '', category: 'Travel', amount: '', description: '', receipt: null });

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const data = await get('/employee/expenses/');
            setExpenses(data || []);
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleSubmit = async (e, isDraft = false) => {
        e.preventDefault();
        try {
            const formDataToSubmit = new FormData();
            formDataToSubmit.append('title', formData.title);
            formDataToSubmit.append('category', formData.category);
            formDataToSubmit.append('amount', formData.amount);
            formDataToSubmit.append('description', formData.description);
            formDataToSubmit.append('status', isDraft ? 'DRAFT' : 'PENDING');
            if (formData.receipt) {
                formDataToSubmit.append('receipt', formData.receipt);
            }

            await post('/employee/expenses/create/', formDataToSubmit);
            alert(`Expense ${isDraft ? 'saved as draft' : 'submitted'} successfully!`);
            setIsModalOpen(false);
            fetchExpenses();
            setFormData({ title: '', category: 'Travel', amount: '', description: '', receipt: null });
        } catch (err) {
            alert('Failed to submit expense: ' + err.message);
        }
    };

    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch = exp.title?.toLowerCase().includes(filters.search.toLowerCase()) || 
                             exp.description?.toLowerCase().includes(filters.search.toLowerCase());
        const matchesStatus = filters.status === 'ALL' || exp.status?.toUpperCase() === filters.status;
        const matchesPayment = filters.payment === 'ALL' || exp.payment_status?.toUpperCase() === filters.payment;
        const matchesDate = (!filters.startDate || new Date(exp.date) >= new Date(filters.startDate)) &&
                           (!filters.endDate || new Date(exp.date) <= new Date(filters.endDate));
        return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });

    const stats = {
        applied: expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
        approved: expenses.filter(e => e.status?.toLowerCase() === 'approved').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
        rejected: expenses.filter(e => e.status?.toLowerCase() === 'rejected').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
        pending: expenses.filter(e => e.status?.toLowerCase() === 'pending').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">My Expenses</h2>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <i className="fa-solid fa-plus"></i> Claim Expense
                </button>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Applied</p>
                    <h2 style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>₹{stats.applied.toFixed(2)}</h2>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <p style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>Total Approved</p>
                    <h2 style={{ fontSize: '1.75rem', color: '#10b981', marginTop: '0.5rem' }}>₹{stats.approved.toFixed(2)}</h2>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <p style={{ color: '#f43f5e', fontSize: '0.85rem', fontWeight: 600 }}>Total Rejected</p>
                    <h2 style={{ fontSize: '1.75rem', color: '#f43f5e', marginTop: '0.5rem' }}>₹{stats.rejected.toFixed(2)}</h2>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <p style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>Total Pending</p>
                    <h2 style={{ fontSize: '1.75rem', color: '#f59e0b', marginTop: '0.5rem' }}>₹{stats.pending.toFixed(2)}</h2>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Search</label>
                        <input type="text" className="form-control" placeholder="Search claims..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} style={{ width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: '8px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status</label>
                        <select className="form-control" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} style={{ width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: '8px' }}>
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="DRAFT">Draft</option>
                        </select>
                    </div>
                    <button className="btn btn-ghost" onClick={() => setFilters({ search: '', status: 'ALL', payment: 'ALL', startDate: '', endDate: '' })} style={{ height: '44px' }}>Reset</button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading expenses...</td></tr>
                        ) : filteredExpenses.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No expense claims found.</td></tr>
                        ) : filteredExpenses.map(exp => (
                            <tr key={exp.id}>
                                <td>{exp.date}</td>
                                <td><strong>{exp.title}</strong><br/><small style={{ color: 'var(--text-muted)' }}>{exp.description}</small></td>
                                <td>{exp.category}</td>
                                <td>₹{parseFloat(exp.amount).toFixed(2)}</td>
                                <td>
                                    <span className={`status-badge ${exp.status?.toLowerCase()}`}>
                                        {exp.status}
                                    </span>
                                </td>
                                <td>{exp.payment_status || 'Unpaid'}</td>
                                <td>
                                    {exp.receipt && <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem' }}><i className="fa-solid fa-file-invoice"></i></button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Expense Modal */}
            {isModalOpen && (
                <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1000, alignItems: 'center', justifySelf: 'stretch', justifyContent: 'center', padding: '1rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 className="gradient-text"><i className="fa-solid fa-receipt"></i> Submit Expense Claim</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <form onSubmit={(e) => handleSubmit(e)}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div className="form-group">
                                    <label>Title/Merchant</label>
                                    <input type="text" className="form-control" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Uber Ride" style={{ width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: '8px' }} />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <option value="Travel">Travel</option>
                                        <option value="Meals">Meals</option>
                                        <option value="Supplies">Supplies</option>
                                        <option value="Software">Software</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div className="form-group">
                                    <label>Amount (₹)</label>
                                    <input type="number" step="0.01" className="form-control" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" style={{ width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: '8px' }} />
                                </div>
                                <div className="form-group">
                                    <label>Receipt File</label>
                                    <input 
                                        type="file" 
                                        className="form-control" 
                                        onChange={e => setFormData({...formData, receipt: e.target.files[0]})}
                                        style={{ width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', padding: '0.5rem', borderRadius: '8px' }} 
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Description</label>
                                <textarea className="form-control" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Provide extra details..." style={{ width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: '8px' }}></textarea>
                            </div>
                            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="button" className="btn btn-ghost" onClick={(e) => handleSubmit(e, true)}>Save Draft</button>
                                <button type="submit" className="btn btn-primary">Submit Claim</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Expenses;

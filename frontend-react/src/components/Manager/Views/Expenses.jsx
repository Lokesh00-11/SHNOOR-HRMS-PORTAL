import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { get, post } from '../../../services/api';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);

    const handleExportToExcel = () => {
        try {
            const titleRow = ["SHNOOR HRM - ORGANIZATION EXPENSE CLAIMS REPORT"];
            const reportRow = ["Report: All Corporate Expense Claims & Payouts"];
            const generatedRow = [`Generated At: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`];
            const emptyRow = [];
            const headerRow = [
                "Employee",
                "Submitted Date",
                "Expense Title",
                "Category",
                "Amount",
                "Approval Status",
                "Payout Status",
                "Receipt URL"
            ];

            const dataRows = expenses.map(exp => [
                exp.employee_name || '-',
                exp.submitted_at_str || '-',
                exp.title || '-',
                exp.category || '-',
                `₹${parseFloat(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                exp.status || '-',
                exp.payment_status || 'Unpaid',
                exp.receipt ? (exp.receipt.startsWith('http') ? exp.receipt : `http://127.0.0.1:8000${exp.receipt}`) : 'None'
            ]);

            const aoaData = [
                titleRow,
                reportRow,
                generatedRow,
                emptyRow,
                headerRow,
                ...dataRows
            ];

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(aoaData);

            // auto-fit cols
            const colWidths = [];
            aoaData.forEach(row => {
                row.forEach((cell, idx) => {
                    const cellVal = cell === null || cell === undefined ? "" : cell.toString();
                    const len = cellVal.length + 3;
                    if (!colWidths[idx] || len > colWidths[idx]) {
                        colWidths[idx] = len;
                    }
                });
            });
            ws['!cols'] = colWidths.map(w => ({ wch: w }));

            XLSX.utils.book_append_sheet(wb, ws, "Org Expenses");
            XLSX.writeFile(wb, `ShnoorHRM_Org_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error('Failed to export excel:', err);
            alert('Failed to export to Excel');
        }
    };

    const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [paymentFilter, setPaymentFilter] = useState('ALL');

    // Modals
    const [reviewExpense, setReviewExpense] = useState(null);
    const [payExpense, setPayExpense] = useState(null);
    const [remark, setRemark] = useState('');

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            let query = `?search=${encodeURIComponent(searchQuery)}`;
            if (statusFilter !== 'ALL') query += `&status=${statusFilter}`;
            if (paymentFilter !== 'ALL') query += `&payment_status=${paymentFilter}`;

            const data = await get(`/manager/expenses/${query}`);
            const list = data || [];
            setExpenses(list);
            calculateStats(list);
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        let total = 0;
        let paid = 0;
        let pending = 0;
        let rejected = 0;

        data.forEach(exp => {
            const amt = parseFloat(exp.amount) || 0;
            const stat = (exp.status || '').toUpperCase();
            const pStat = (exp.payment_status || '').toUpperCase();

            total += amt;
            if (stat === 'PENDING') pending += amt;
            else if (stat === 'REJECTED') rejected += amt;
            
            if (pStat === 'PAID') paid += amt;
        });

        setStats({ total, paid, pending, rejected });
    };

    useEffect(() => {
        fetchExpenses();
    }, [statusFilter, paymentFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchExpenses();
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setPaymentFilter('ALL');
        // Let's refetch 
        setTimeout(() => {
            fetchExpenses();
        }, 50);
    };

    const handleReviewSubmit = async (decision) => {
        if (!remark) {
            alert('Please provide a review remark.');
            return;
        }
        try {
            await post('/manager/expenses/approve/', {
                expense_id: reviewExpense.id,
                status: decision,
                remark: remark
            });
            alert(`Expense claim successfully ${decision.toLowerCase()}!`);
            setReviewExpense(null);
            setRemark('');
            fetchExpenses();
        } catch (err) {
            alert('Failed to save manager review decision.');
            console.error(err);
        }
    };

    const handlePaymentSubmit = async () => {
        try {
            await post('/manager/expenses/pay/', {
                expense_id: payExpense.id,
                payment_status: 'PAID',
                remark: remark
            });
            alert('Disbursement successfully marked as Paid!');
            setPayExpense(null);
            setRemark('');
            fetchExpenses();
        } catch (err) {
            alert('Failed to update payout settlement.');
            console.error(err);
        }
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 className="gradient-text" style={{ marginBottom: 0 }}>Organization Expense Claims</h2>
                <button 
                    className="btn btn-primary" 
                    onClick={handleExportToExcel}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', borderColor: '#10b981', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                >
                    <i className="fa-solid fa-file-excel"></i> Export to Excel
                </button>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Claims</h4>
                    <h1 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
                        ₹{stats.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Paid Disbursement</h4>
                    <h1 style={{ fontSize: '2rem', color: '#10b981', marginTop: '0.5rem' }}>
                        ₹{stats.paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Pending Review</h4>
                    <h1 style={{ fontSize: '2rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                        ₹{stats.pending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h1>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Rejected Claims</h4>
                    <h1 style={{ fontSize: '2rem', color: '#f43f5e', marginTop: '0.5rem' }}>
                        ₹{stats.rejected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h1>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder="Search by title or employee..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 2, minWidth: '200px', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status:</span>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                        >
                            <option value="ALL">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Payout:</span>
                        <select 
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                        >
                            <option value="ALL">All</option>
                            <option value="UNPAID">Unpaid</option>
                            <option value="PAID">Paid</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem' }}>Search</button>
                        <button type="button" className="btn btn-ghost" onClick={handleClearFilters} style={{ padding: '0.6rem 1.2rem' }}>Clear</button>
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Submitted Date</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Approval Status</th>
                            <th>Payout Status</th>
                            <th>Receipt</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="9" style={{ textAlign: 'center' }}>Loading expense claims...</td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No expense claims found.</td></tr>
                        ) : (
                            expenses.map((exp, index) => {
                                const statusLower = (exp.status || '').toLowerCase();
                                const statusClass = statusLower === 'approved' ? 'active' : (statusLower === 'rejected' ? 'expired' : 'pending');
                                
                                const paidLower = (exp.payment_status || '').toLowerCase();
                                const isPaid = paidLower === 'paid';

                                const receiptUrl = exp.receipt ? (exp.receipt.startsWith('http') ? exp.receipt : `http://127.0.0.1:8000${exp.receipt}`) : null;

                                return (
                                    <tr key={exp.id || index}>
                                        <td style={{ fontWeight: 600 }}>{exp.employee_name}</td>
                                        <td>{exp.submitted_at_str || '-'}</td>
                                        <td>{exp.title}</td>
                                        <td>{exp.category}</td>
                                        <td style={{ fontWeight: 600 }}>₹{parseFloat(exp.amount || 0).toFixed(2)}</td>
                                        <td>
                                            <span className={`status-badge ${statusClass}`}>
                                                {exp.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: isPaid ? '#10b981' : '#9ca3af', fontWeight: 600, fontSize: '0.8rem' }}>
                                                <i className={`fa-solid ${isPaid ? 'fa-circle-check' : 'fa-circle-dot'}`} style={{ marginRight: '4px' }}></i>
                                                {isPaid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td>
                                            {receiptUrl ? (
                                                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500, fontSize: '0.85rem' }}>
                                                    <i className="fa-solid fa-arrow-up-right-from-square"></i> View
                                                </a>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}><i className="fa-solid fa-ban"></i> None</span>
                                            )}
                                        </td>
                                        <td>
                                            {statusLower === 'pending' ? (
                                                <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setReviewExpense(exp)}>
                                                    <i className="fa-solid fa-gavel"></i> Review
                                                </button>
                                            ) : (statusLower === 'approved' && !isPaid) ? (
                                                <button className="btn btn-ghost" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#10b981', borderColor: '#10b981' }} onClick={() => setPayExpense(exp)}>
                                                    <i className="fa-solid fa-wallet"></i> Pay
                                                </button>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Review Claim Modal */}
            {reviewExpense && (
                <div className="modal-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', borderRadius: '16px' }}>
                        <button onClick={() => { setReviewExpense(null); setRemark(''); }} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Review Expense Claim</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Employee:</strong> <span style={{ fontWeight: 600 }}>{reviewExpense.employee_name}</span></div>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Amount:</strong> <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>₹{parseFloat(reviewExpense.amount || 0).toFixed(2)}</span></div>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Category:</strong> <span>{reviewExpense.category}</span></div>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Submitted:</strong> <span>{reviewExpense.submitted_at_str}</span></div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Review Remark</label>
                            <input 
                                type="text"
                                required
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                placeholder="Enter approval/rejection remark..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => { setReviewExpense(null); setRemark(''); }}>Cancel</button>
                            <button className="btn btn-ghost" style={{ color: '#f43f5e', borderColor: '#f43f5e' }} onClick={() => handleReviewSubmit('Rejected')}>Reject</button>
                            <button className="btn btn-primary" onClick={() => handleReviewSubmit('Approved')}>Approve</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payout Modal */}
            {payExpense && (
                <div className="modal-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', borderRadius: '16px' }}>
                        <button onClick={() => { setPayExpense(null); setRemark(''); }} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Disburse Expense Payout</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Employee:</strong> <span style={{ fontWeight: 600 }}>{payExpense.employee_name}</span></div>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Amount:</strong> <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>₹{parseFloat(payExpense.amount || 0).toFixed(2)}</span></div>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Category:</strong> <span>{payExpense.category}</span></div>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Approved:</strong> <span>{payExpense.submitted_at_str}</span></div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Payment Reference/Remark</label>
                            <input 
                                type="text"
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                placeholder="e.g. Bank Transfer ID / reference..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => { setPayExpense(null); setRemark(''); }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handlePaymentSubmit}><i className="fa-solid fa-check"></i> Mark as Paid</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Expenses;

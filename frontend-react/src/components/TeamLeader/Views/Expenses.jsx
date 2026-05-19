import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { get, post, API_BASE } from '../../../services/api';

const Expenses = () => {
    const [activeTab, setActiveTab] = useState('team'); // 'team' or 'self'

    const handleExportTeamExpensesToExcel = () => {
        try {
            const titleRow = ["SHNOOR HRM - TEAM EXPENSE CLAIMS REPORT"];
            const reportRow = ["Report: Sub-members Expense Claims"];
            const generatedRow = [`Generated At: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`];
            const emptyRow = [];
            const headerRow = [
                "Employee",
                "Submitted Date",
                "Expense Title",
                "Category",
                "Amount",
                "Status",
                "Receipt URL"
            ];

            const dataRows = teamExpenses.map(exp => [
                exp.employee_name || '-',
                exp.submitted_at_str || '-',
                exp.title || '-',
                exp.category || '-',
                `₹${parseFloat(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                exp.status || '-',
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

            // Calculate auto-fit columns
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

            XLSX.utils.book_append_sheet(wb, ws, "Team Expenses");
            XLSX.writeFile(wb, `ShnoorHRM_Team_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error('Failed to export excel:', err);
            alert('Failed to export to Excel');
        }
    };

    const handleExportSelfExpensesToExcel = () => {
        try {
            const titleRow = ["SHNOOR HRM - PERSONAL EXPENSE CLAIMS REPORT"];
            const reportRow = ["Report: My Personal Reimbursements"];
            const generatedRow = [`Generated At: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`];
            const emptyRow = [];
            const headerRow = [
                "Submitted Date",
                "Expense Title",
                "Category",
                "Amount",
                "Status",
                "Payment Status",
                "Receipt URL",
                "Manager Remark"
            ];

            const dataRows = selfExpenses.map(exp => [
                exp.submitted_at_str || '-',
                exp.title || '-',
                exp.category || '-',
                `₹${parseFloat(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                exp.status || '-',
                exp.payment_status || 'Unpaid',
                exp.receipt ? (exp.receipt.startsWith('http') ? exp.receipt : `http://127.0.0.1:8000${exp.receipt}`) : 'None',
                exp.manager_remark || '-'
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

            // Calculate auto-fit columns
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

            XLSX.utils.book_append_sheet(wb, ws, "My Expenses");
            XLSX.writeFile(wb, `ShnoorHRM_My_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error('Failed to export excel:', err);
            alert('Failed to export to Excel');
        }
    };
    
    // Team expenses 
    const [teamExpenses, setTeamExpenses] = useState([]);
    const [teamLoading, setTeamLoading] = useState(true);
    const [teamSearch, setTeamSearch] = useState('');
    const [teamStatus, setTeamStatus] = useState('ALL');

    // Self expenses 
    const [selfExpenses, setSelfExpenses] = useState([]);
    const [selfLoading, setSelfLoading] = useState(true);
    const [selfSearch, setSelfSearch] = useState('');
    const [selfStatus, setSelfStatus] = useState('ALL');

    // Modals connection
    const [reviewClaim, setReviewClaim] = useState(null);
    const [reviewRemark, setReviewRemark] = useState('');
    const [showClaimModal, setShowClaimModal] = useState(false);
    
    // Claims
    const [newClaim, setNewClaim] = useState({
        title: '',
        category: 'Travel',
        amount: '',
        description: ''
    });
    const [receiptFile, setReceiptFile] = useState(null);

    const fetchTeamExpenses = async () => {
        try {
            setTeamLoading(true);
            let query = `?search=${encodeURIComponent(teamSearch)}`;
            if (teamStatus !== 'ALL') query += `&status=${teamStatus}`;
            const data = await get(`/teamleader/expenses/${query}`);
            setTeamExpenses(data || []);
        } catch (err) {
            console.error('Error loading team expenses:', err);
        } finally {
            setTeamLoading(false);
        }
    };

    const fetchSelfExpenses = async () => {
        try {
            setSelfLoading(true);
            let query = `?search=${encodeURIComponent(selfSearch)}`;
            if (selfStatus !== 'ALL') query += `&status=${selfStatus}`;
            const data = await get(`/employee/expenses/${query}`);
            setSelfExpenses(data || []);
        } catch (err) {
            console.error('Error loading self expenses:', err);
        } finally {
            setSelfLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'team') {
            fetchTeamExpenses();
        } else {
            fetchSelfExpenses();
        }
    }, [activeTab, teamSearch, teamStatus, selfSearch, selfStatus]);

    const handleReviewSubmit = async (decision) => {
        if (!reviewRemark) {
            alert('Please provide a review remark/comment.');
            return;
        }

        try {
            const data = await post('/teamleader/expenses/update/', {
                expense_id: reviewClaim.id,
                status: decision,
                remark: reviewRemark
            });

            if (data) {
                alert(`Expense claim successfully ${decision.toLowerCase()}!`);
                setReviewClaim(null);
                setReviewRemark('');
                fetchTeamExpenses();
            } else {
                alert('Failed to save review decision.');
            }
        } catch (err) {
            console.error(err);
            alert('Error submitting review decision.');
        }
    };

    const handleFileClaim = async (e, isDraft = false) => {
        e.preventDefault();
        if (!newClaim.category || !newClaim.amount) {
            alert('Category and Amount are required fields.');
            return;
        }

        const uploadData = new FormData();
        uploadData.append('title', newClaim.title);
        uploadData.append('category', newClaim.category);
        uploadData.append('amount', newClaim.amount);
        uploadData.append('description', newClaim.description);
        uploadData.append('status', isDraft ? 'DRAFT' : 'PENDING');
        if (receiptFile) {
            uploadData.append('receipt', receiptFile);
        }

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Token ${token}`;

        try {
            const res = await fetch(`${API_BASE}/employee/expenses/create/`, {
                method: 'POST',
                headers,
                body: uploadData
            });

            if (res.ok) {
                alert(isDraft ? 'Draft expense saved successfully!' : 'Expense claim submitted successfully!');
                setShowClaimModal(false);
                setNewClaim({ title: '', category: 'Travel', amount: '', description: '' });
                setReceiptFile(null);
                fetchSelfExpenses();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to submit expense claim.');
            }
        } catch (err) {
            console.error(err);
            alert('Error submitting expense claim.');
        }
    };

    // cal
    const calculateStats = (claims) => {
        let total = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        claims.forEach(exp => {
            const amt = parseFloat(exp.amount) || 0;
            const stat = (exp.status || '').toUpperCase();
            total += amt;
            if (stat === 'PENDING') pending += amt;
            else if (stat === 'APPROVED') approved += amt;
            else if (stat === 'REJECTED') rejected += amt;
        });

        return { total, pending, approved, rejected };
    };

    const stats = calculateStats(activeTab === 'team' ? teamExpenses : selfExpenses);

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 className="gradient-text" style={{ marginBottom: 0 }}>{activeTab === 'team' ? 'Team Expense Claims' : 'My Personal Claims'}</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={activeTab === 'team' ? handleExportTeamExpensesToExcel : handleExportSelfExpensesToExcel}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', borderColor: '#10b981', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                        <i className="fa-solid fa-file-excel"></i> Export to Excel
                    </button>
                    {activeTab === 'self' && (
                        <button className="btn btn-primary" onClick={() => setShowClaimModal(true)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                            <i className="fa-solid fa-receipt"></i> Claim Expense
                        </button>
                    )}
                </div>
            </div>

            {/* Subtabs selectors */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <button 
                    className={`btn ${activeTab === 'team' ? 'btn-primary active' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('team')}
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                    Sub-members Claims
                </button>
                <button 
                    className={`btn ${activeTab === 'self' ? 'btn-primary active' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('self')}
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                    My Reimbursements
                </button>
            </div>

            {/* Stats Dashboard Grid */}
            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aggregate Sum</span>
                    <h3 style={{ fontSize: '1.5rem', margin: '0.25rem 0 0', fontWeight: 700 }}>
                        ₹{stats.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending Claims</span>
                    <h3 style={{ fontSize: '1.5rem', margin: '0.25rem 0 0', color: '#f59e0b', fontWeight: 700 }}>
                        ₹{stats.pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Approved Claims</span>
                    <h3 style={{ fontSize: '1.5rem', margin: '0.25rem 0 0', color: '#10b981', fontWeight: 700 }}>
                        ₹{stats.approved.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rejected Claims</span>
                    <h3 style={{ fontSize: '1.5rem', margin: '0.25rem 0 0', color: '#f43f5e', fontWeight: 700 }}>
                        ₹{stats.rejected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h3>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                    type="text" 
                    placeholder="Search by title, category..." 
                    value={activeTab === 'team' ? teamSearch : selfSearch}
                    onChange={(e) => activeTab === 'team' ? setTeamSearch(e.target.value) : setSelfSearch(e.target.value)}
                    style={{ flex: 2, minWidth: '200px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Filter Status:</span>
                    <select 
                        value={activeTab === 'team' ? teamStatus : selfStatus}
                        onChange={(e) => activeTab === 'team' ? setTeamStatus(e.target.value) : setSelfStatus(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    >
                        <option value="ALL">All Claims</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Records List Table */}
            {activeTab === 'team' ? (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Submitted Date</th>
                                <th>Expense Title</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Receipt</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamLoading ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center' }}>Loading team expenses...</td></tr>
                            ) : teamExpenses.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No team expense claims found.</td></tr>
                            ) : (
                                teamExpenses.map((exp, index) => {
                                    const statusLower = (exp.status || '').toLowerCase();
                                    const statusClass = statusLower === 'approved' ? 'active' : statusLower === 'rejected' ? 'danger' : 'pending';
                                    const fileUrl = exp.receipt ? (exp.receipt.startsWith('http') ? exp.receipt : `http://127.0.0.1:8000${exp.receipt}`) : null;
                                    return (
                                        <tr key={exp.id || index}>
                                            <td style={{ fontWeight: 600 }}>{exp.employee_name}</td>
                                            <td>{exp.submitted_at_str || '-'}</td>
                                            <td>{exp.title}</td>
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
                                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>
                                                        <i className="fa-solid fa-arrow-up-right-from-square"></i> View
                                                    </a>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>None</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {statusLower === 'pending' ? (
                                                    <button className="btn btn-primary" onClick={() => setReviewClaim(exp)} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                                                        <i className="fa-solid fa-gavel"></i> Review
                                                    </button>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Submitted Date</th>
                                <th>Expense Title</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Receipt</th>
                                <th>Manager Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selfLoading ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center' }}>Loading my expenses...</td></tr>
                            ) : selfExpenses.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No personal expense claims found.</td></tr>
                            ) : (
                                selfExpenses.map((exp, index) => {
                                    const statusLower = (exp.status || '').toLowerCase();
                                    const statusClass = statusLower === 'approved' ? 'active' : statusLower === 'rejected' ? 'danger' : statusLower === 'draft' ? 'info' : 'pending';
                                    const payLower = (exp.payment_status || '').toLowerCase();
                                    const payClass = payLower === 'paid' ? 'active' : 'pending';
                                    const fileUrl = exp.receipt ? (exp.receipt.startsWith('http') ? exp.receipt : `http://127.0.0.1:8000${exp.receipt}`) : null;
                                    return (
                                        <tr key={exp.id || index}>
                                            <td>{exp.submitted_at_str || '-'}</td>
                                            <td style={{ fontWeight: 600 }}>{exp.title}</td>
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
                                                <span className={`status-badge ${payClass}`}>
                                                    {exp.payment_status || 'Unpaid'}
                                                </span>
                                            </td>
                                            <td>
                                                {fileUrl ? (
                                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>
                                                        <i className="fa-solid fa-arrow-up-right-from-square"></i> View
                                                    </a>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>None</span>
                                                )}
                                            </td>
                                            <td>{exp.manager_remark || '-'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Review Claim Modal */}
            {reviewClaim && (
                <div className="modal-overlay" style={{ display: 'block', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setReviewClaim(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <h3 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Review Expense Claim</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Employee:</strong> <span style={{ fontWeight: 600 }}>{reviewClaim.employee_name}</span></div>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Amount:</strong> <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>₹{parseFloat(reviewClaim.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Category:</strong> <span>{reviewClaim.category}</span></div>
                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Submitted Date:</strong> <span>{reviewClaim.submitted_at_str}</span></div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Review Remarks / Feedback</label>
                            <textarea 
                                rows="3"
                                value={reviewRemark}
                                onChange={(e) => setReviewRemark(e.target.value)}
                                placeholder="State review decision justifications..."
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => handleReviewSubmit('REJECTED')} style={{ color: '#f43f5e', borderColor: 'rgba(244,63,94,0.15)', flex: 1 }}>Reject</button>
                            <button className="btn btn-primary" onClick={() => handleReviewSubmit('APPROVED')} style={{ flex: 1 }}>Approve</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Personal Claim Application Form Modal */}
            {showClaimModal && (
                <div className="modal-overlay" style={{ display: 'block', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '550px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setShowClaimModal(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <h3 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Apply Personal Claim</h3>
                        <form onSubmit={(e) => handleFileClaim(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Expense Claim Title</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newClaim.title}
                                    onChange={(e) => setNewClaim({...newClaim, title: e.target.value})}
                                    placeholder="e.g. Travel fuel bills HQ visit"
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Category</label>
                                <select 
                                    value={newClaim.category}
                                    onChange={(e) => setNewClaim({...newClaim, category: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                >
                                    <option value="Travel">Travel</option>
                                    <option value="Meals">Meals</option>
                                    <option value="Hardware">Hardware</option>
                                    <option value="Software">Software</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Amount (INR)</label>
                                <input 
                                    type="number" 
                                    required
                                    value={newClaim.amount}
                                    onChange={(e) => setNewClaim({...newClaim, amount: e.target.value})}
                                    placeholder="Enter claim amount"
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Receipt Attachment (Image/PDF)</label>
                                <input 
                                    type="file" 
                                    onChange={(e) => setReceiptFile(e.target.files[0])}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Description Remarks</label>
                                <textarea 
                                    rows="3"
                                    value={newClaim.description}
                                    onChange={(e) => setNewClaim({...newClaim, description: e.target.value})}
                                    placeholder="Additional description..."
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'none' }}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-ghost" onClick={(e) => handleFileClaim(e, true)} style={{ flex: 1 }}>Save Draft</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Claim</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Expenses;

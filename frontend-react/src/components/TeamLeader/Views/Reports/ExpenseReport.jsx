import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { get } from '../../../../services/api';

const ExpenseReport = ({ onBack }) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await get('/teamleader/expenses/');
                setExpenses(data || []);
            } catch (err) {
                console.error('Error fetching expense report:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    let totalAmount = 0, pendingAmount = 0, approvedAmount = 0;
    expenses.forEach(e => {
        const amt = parseFloat(e.amount) || 0;
        totalAmount += amt;
        if ((e.status || '').toLowerCase() === 'pending') pendingAmount += amt;
        if ((e.status || '').toLowerCase() === 'approved') approvedAmount += amt;
    });

    const handleExport = () => {
        const titleRow = ["SHNOOR HRM - EXPENSE REPORT"];
        const header = ["Employee", "Category", "Amount", "Status", "Date"];
        const rows = expenses.map(e => [e.employee_name, e.category, e.amount, e.status, e.submitted_at_str]);
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([titleRow, [], header, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "Expenses");
        XLSX.writeFile(wb, `Expense_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="fade-in">
            <button onClick={onBack} className="btn" style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back to Reports
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Expense Detail Report</h2>
                <button className="btn btn-primary" onClick={handleExport} style={{ background: '#f59e0b', borderColor: '#f59e0b' }}>
                    <i className="fa-solid fa-file-excel" style={{ marginRight: '0.5rem' }}></i> Export CSV
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
                </div>
            ) : (
                <>
                    <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Total Expenses</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{totalAmount.toFixed(2)}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Approved</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>₹{approvedAmount.toFixed(2)}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Pending</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>₹{pendingAmount.toFixed(2)}</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExpenseReport;

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { get } from '../../../../services/api';

const PayrollReport = ({ onBack }) => {
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await get('/teamleader/payroll/');
                setPayroll(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching payroll report:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    let totalPayroll = 0;
    payroll.forEach(p => {
        totalPayroll += parseFloat(p.amount_credited) || 0;
    });

    const handleExport = () => {
        const titleRow = ["SHNOOR HRM - PAYROLL OPERATIONAL REPORT"];
        const header = ["Employee", "Month", "Base Salary", "Credited?", "Amount Credited", "Payment Date"];
        const rows = payroll.map(p => [p.name, p.month, p.salary, p.credited ? 'Yes' : 'No', p.amount_credited, p.payment_date || '-']);
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([titleRow, [], header, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "Payroll");
        XLSX.writeFile(wb, `Payroll_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="fade-in">
            <button onClick={onBack} className="btn" style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back to Reports
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Payroll Operational Report</h2>
                <button className="btn btn-primary" onClick={handleExport} style={{ background: '#ec4899', borderColor: '#ec4899' }}>
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
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Total Payroll Disbursed</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ec4899' }}>₹{totalPayroll.toFixed(2)}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Employees Credited</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{payroll.filter(p => p.credited).length} / {payroll.length}</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PayrollReport;

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { get } from '../../../../services/api';

const FinanceReportsPanel = ({ teamExpenses }) => {
    const [loading, setLoading] = useState(false);

    const handleExportExpenses = () => {
        try {
            const titleRow = ["SHNOOR HRM - EXPENSES REPORT (TEAM LEVEL)"];
            const generatedRow = [`Generated At: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`];
            
            const expHeader = ["Employee", "Category", "Amount", "Status", "Date"];
            const expRows = teamExpenses.map(e => [
                e.employee_name, e.category, e.amount, e.status, e.submitted_at_str
            ]);

            const aoaData = [
                titleRow, generatedRow, [],
                ["OPERATIONAL EXPENSES"], [],
                expHeader, ...expRows
            ];

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(aoaData);

            XLSX.utils.book_append_sheet(wb, ws, "Expenses Report");
            XLSX.writeFile(wb, `ShnoorHRM_Expenses_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error('Failed to export excel:', err);
            alert('Failed to export report');
        }
    };

    const handleExportPayroll = async () => {
        try {
            setLoading(true);
            const payrollData = await get('/manager/payroll/');
            
            const titleRow = ["SHNOOR HRM - PAYROLL REPORT (TEAM LEVEL)"];
            const generatedRow = [`Generated At: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`];
            
            const header = ["Employee", "Month", "Base Salary", "Credited?", "Amount Credited", "Payment Date"];
            const rows = payrollData.map(p => [
                p.name, p.month, p.salary, p.credited ? "Yes" : "No", p.amount_credited, p.payment_date || 'N/A'
            ]);

            const aoaData = [
                titleRow, generatedRow, [],
                ["PAYROLL DETAILS"], [],
                header, ...rows
            ];

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(aoaData);

            XLSX.utils.book_append_sheet(wb, ws, "Payroll Report");
            XLSX.writeFile(wb, `ShnoorHRM_Payroll_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error('Failed to export excel:', err);
            alert('Failed to export report');
        } finally {
            setLoading(false);
        }
    };

    const handleExportTotal = async () => {
        try {
            setLoading(true);
            const payrollData = await get('/manager/payroll/');
            
            const titleRow = ["SHNOOR HRM - TOTAL FINANCIAL REPORT (TEAM LEVEL)"];
            const generatedRow = [`Generated At: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`];
            
            // Expenses
            const expHeader = ["Employee", "Category", "Amount", "Status", "Date"];
            const expRows = teamExpenses.map(e => [
                e.employee_name, e.category, e.amount, e.status, e.submitted_at_str
            ]);
            
            // Payroll
            const payHeader = ["Employee", "Month", "Base Salary", "Credited?", "Amount Credited", "Payment Date"];
            const payRows = payrollData.map(p => [
                p.name, p.month, p.salary, p.credited ? "Yes" : "No", p.amount_credited, p.payment_date || 'N/A'
            ]);

            const aoaData = [
                titleRow, generatedRow, [],
                ["OPERATIONAL EXPENSES"], [],
                expHeader, ...expRows,
                [], [],
                ["PAYROLL DETAILS"], [],
                payHeader, ...payRows
            ];

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(aoaData);

            XLSX.utils.book_append_sheet(wb, ws, "Total Financial Report");
            XLSX.writeFile(wb, `ShnoorHRM_Total_Finance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error('Failed to export excel:', err);
            alert('Failed to export report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Export Financial Snapshots</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Generate localized CSV/Excel snapshots for expenses, payroll, or a combined total report.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {/* Expenses Report Card */}
                <div 
                    className="glass-panel report-card" 
                    onClick={handleExportExpenses}
                    style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s', border: '1px solid var(--glass-border)' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        <i className="fa-solid fa-file-invoice-dollar" style={{ fontSize: '3rem', color: '#38bdf8' }}></i>
                        <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: '#ec4899', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #1e293b' }}>
                            <i className="fa-solid fa-clock" style={{ color: '#fff', fontSize: '1rem' }}></i>
                        </div>
                    </div>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>Expenses Report</h4>
                    <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        This report displays team's detailed monthly operational expenses & reimbursements data.
                    </p>
                </div>

                {/* Payroll Report Card */}
                <div 
                    className="glass-panel report-card" 
                    onClick={!loading ? handleExportPayroll : null}
                    style={{ padding: '2rem', textAlign: 'center', cursor: loading ? 'wait' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s', border: '1px solid var(--glass-border)', opacity: loading ? 0.7 : 1 }}
                    onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                >
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        <i className="fa-solid fa-money-check-dollar" style={{ fontSize: '3rem', color: '#fcd34d' }}></i>
                        <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: '#ec4899', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #1e293b' }}>
                            <i className="fa-solid fa-clock" style={{ color: '#fff', fontSize: '1rem' }}></i>
                        </div>
                    </div>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>Payroll Report</h4>
                    <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        This report displays team's detailed monthly salary disbursement data.
                    </p>
                </div>

                {/* Total Finance Report Card */}
                <div 
                    className="glass-panel report-card" 
                    onClick={!loading ? handleExportTotal : null}
                    style={{ padding: '2rem', textAlign: 'center', cursor: loading ? 'wait' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s', border: '1px solid var(--glass-border)', opacity: loading ? 0.7 : 1 }}
                    onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                >
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        <i className="fa-solid fa-chart-pie" style={{ fontSize: '3rem', color: '#a78bfa' }}></i>
                        <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: '#ec4899', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #1e293b' }}>
                            <i className="fa-solid fa-clock" style={{ color: '#fff', fontSize: '1rem' }}></i>
                        </div>
                    </div>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>Total Finance Report</h4>
                    <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        This report displays comprehensive consolidated financial data for the team.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FinanceReportsPanel;

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { get } from '../../../../services/api';

const OvertimeReport = ({ onBack }) => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await get('/manager/attendance/');
                setAttendance(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching overtime report:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleExport = () => {
        const titleRow = ["SHNOOR HRM - OVERTIME REPORT"];
        const header = ["Date", "Employee", "Overtime Hours", "Status"];
        const rows = attendance.map(a => [a.date, a.employee_name, "0", "N/A"]);
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([titleRow, [], header, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "Overtime");
        XLSX.writeFile(wb, `Overtime_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="fade-in">
            <button onClick={onBack} className="btn" style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back to Reports
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Overtime Report</h2>
                <button className="btn btn-primary" onClick={handleExport} style={{ background: '#6366f1', borderColor: '#6366f1' }}>
                    <i className="fa-solid fa-file-excel" style={{ marginRight: '0.5rem' }}></i> Export CSV
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Overtime Logged</h4>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#6366f1' }}>0 Hours</div>
                </div>
            )}
        </div>
    );
};

export default OvertimeReport;

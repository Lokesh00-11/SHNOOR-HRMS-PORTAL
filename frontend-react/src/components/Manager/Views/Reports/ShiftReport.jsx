import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { get } from '../../../../services/api';

const ShiftReport = ({ onBack }) => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await get('/manager/attendance/');
                setAttendance(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching shift report:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleExport = () => {
        const titleRow = ["SHNOOR HRM - SHIFT REPORT"];
        const header = ["Date", "Employee", "Shift Name", "Start Time", "End Time", "Actual Check In", "Actual Check Out"];
        const rows = attendance.map(a => [a.date, a.employee_name, a.shift_name || 'Standard', '-', '-', a.check_in_time || '-', a.check_out_time || '-']);
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([titleRow, [], header, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "Shifts");
        XLSX.writeFile(wb, `Shift_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="fade-in">
            <button onClick={onBack} className="btn" style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back to Reports
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Employee Shift Details</h2>
                <button className="btn btn-primary" onClick={handleExport} style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>
                    <i className="fa-solid fa-file-excel" style={{ marginRight: '0.5rem' }}></i> Export CSV
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Shift details aggregated from current operational data.</p>
                </div>
            )}
        </div>
    );
};

export default ShiftReport;

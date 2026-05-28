import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { get } from '../../../../services/api';

const LeaveReport = ({ onBack }) => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await get('/manager/attendance/');
                setAttendance(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching leave report:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const approvedLeaves = attendance.filter(a => (a.status || '').toLowerCase() === 'leave_approved');
    const totalLeaves = approvedLeaves.length;

    let overlappingLeavesCount = 0;
    const leaveDates = {};
    approvedLeaves.forEach(a => {
        if (a.date) {
            leaveDates[a.date] = (leaveDates[a.date] || 0) + 1;
        }
    });
    Object.values(leaveDates).forEach(count => {
        if (count > 1) {
            overlappingLeavesCount += (count - 1);
        }
    });

    const handleExport = () => {
        const titleRow = ["SHNOOR HRM - LEAVE REPORT"];
        const header = ["Date", "Employee", "Status"];
        const rows = approvedLeaves.map(a => [a.date, a.employee_name, a.status]);
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([titleRow, [], header, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "Leaves");
        XLSX.writeFile(wb, `Leave_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="fade-in">
            <button onClick={onBack} className="btn" style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back to Reports
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Leave Analysis Report</h2>
                <button className="btn btn-primary" onClick={handleExport} style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}>
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
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Approved Leaves (30 Days)</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0ea5e9' }}>{totalLeaves}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Overlapping Leaves</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{overlappingLeavesCount}</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default LeaveReport;

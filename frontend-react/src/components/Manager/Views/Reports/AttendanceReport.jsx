import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { get } from '../../../../services/api';

const AttendanceReport = ({ onBack }) => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await get('/manager/attendance/');
                setAttendance(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching attendance report:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalRecords = attendance.length;
    const lateCheckins = attendance.filter(a => {
        if (!a.check_in || a.check_in === '-') return false;
        return a.check_in.includes('10:') || a.check_in.includes('11:') || a.check_in.includes('12:');
    }).length;
    const absences = attendance.filter(a => (a.status || '').toLowerCase() === 'absent').length;
    const attendancePercentage = totalRecords > 0 ? Math.round(((totalRecords - absences) / totalRecords) * 100) : 100;

    const handleExport = () => {
        const titleRow = ["SHNOOR HRM - ATTENDANCE REPORT"];
        const header = ["Date", "Employee", "Check In", "Check Out", "Status"];
        const rows = attendance.map(a => [a.date, a.employee_name, a.check_in || '-', a.check_out || '-', a.status || '-']);
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([titleRow, [], header, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="fade-in">
            <button onClick={onBack} className="btn" style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back to Reports
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Monthly Attendance Detail Report</h2>
                <button className="btn btn-primary" onClick={handleExport} style={{ background: '#10b981', borderColor: '#10b981' }}>
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
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Attendance Rate</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{attendancePercentage}%</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Late Check-ins</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{lateCheckins}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Absences</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>{absences}</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AttendanceReport;

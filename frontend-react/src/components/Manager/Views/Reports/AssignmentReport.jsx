import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { get } from '../../../../services/api';

const AssignmentReport = ({ onBack }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await get('/manager/tasks/');
                setTasks(data?.team_tasks || []);
            } catch (err) {
                console.error('Error fetching assignment report:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => (t.status || '').toLowerCase() === 'completed').length;
    const overdueTasks = tasks.filter(t => (t.status || '').toLowerCase() !== 'completed' && new Date(t.deadline) < new Date()).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const handleExport = () => {
        const titleRow = ["SHNOOR HRM - ASSIGNMENT REPORT"];
        const header = ["Task ID", "Title", "Assigned To", "Status", "Priority", "Due Date"];
        const rows = tasks.map(t => [t.id, t.title, t.assigned_to_name, t.status, t.priority, t.due_date_str]);
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([titleRow, [], header, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "Assignments");
        XLSX.writeFile(wb, `Assignment_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="fade-in">
            <button onClick={onBack} className="btn" style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back to Reports
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Monthly Assignment Detail Report</h2>
                <button className="btn btn-primary" onClick={handleExport} style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
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
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Completion Rate</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{completionRate}%</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Total Assignments</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalTasks}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Overdue Tasks</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{overdueTasks}</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AssignmentReport;

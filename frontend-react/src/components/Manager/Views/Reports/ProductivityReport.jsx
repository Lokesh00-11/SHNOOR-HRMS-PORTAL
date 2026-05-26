import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { get } from '../../../../services/api';

const ProductivityReport = ({ onBack }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await get('/manager/tasks/');
                setTasks(data?.team_tasks || []);
            } catch (err) {
                console.error('Error fetching productivity report:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => (t.status || '').toLowerCase() === 'completed').length;
    const pendingTasks = tasks.filter(t => (t.status || '').toLowerCase() !== 'completed');
    const highPriorityTasks = tasks.filter(t => (t.priority || '').toLowerCase() === 'high' && (t.status || '').toLowerCase() !== 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const blockers = highPriorityTasks > 0 ? `${highPriorityTasks} High Priority Pending` : 'None detected';
    
    // Calculate overloaded employees (more than 3 pending tasks)
    const employeeTaskCount = {};
    pendingTasks.forEach(t => {
        if (t.assigned_to_name) {
            employeeTaskCount[t.assigned_to_name] = (employeeTaskCount[t.assigned_to_name] || 0) + 1;
        }
    });
    
    let overloadedCount = 0;
    Object.values(employeeTaskCount).forEach(count => {
        if (count > 3) overloadedCount++;
    });
    
    const overloadedEmployeesText = overloadedCount > 0 ? `${overloadedCount} Employees Overloaded` : 'Workload Balanced';

    const handleExport = () => {
        const titleRow = ["SHNOOR HRM - PRODUCTIVITY REPORT"];
        const header = ["Task ID", "Title", "Assigned To", "Status", "Priority"];
        const rows = tasks.map(t => [t.id, t.title, t.assigned_to_name, t.status, t.priority]);
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([titleRow, [], header, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "Productivity");
        XLSX.writeFile(wb, `Productivity_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="fade-in">
            <button onClick={onBack} className="btn" style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back to Reports
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Team Productivity Report</h2>
                <button className="btn btn-primary" onClick={handleExport} style={{ background: '#f43f5e', borderColor: '#f43f5e' }}>
                    <i className="fa-solid fa-file-excel" style={{ marginRight: '0.5rem' }}></i> Export CSV
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
                </div>
            ) : (
                <>
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Productivity Report: Task Completion</h3>
                            <div style={{ width: '100%', height: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${completionRate}%`, background: 'var(--primary-color)', transition: 'width 1s ease-out' }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <span>Sprint Start</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '1.1rem' }}>{completionRate}%</span>
                                <span>Goal</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Operational Bottlenecks</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f43f5e' }}>{blockers}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Workload Balancing</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{overloadedEmployeesText}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>High Priority Workload</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{highPriorityTasks} Active</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProductivityReport;

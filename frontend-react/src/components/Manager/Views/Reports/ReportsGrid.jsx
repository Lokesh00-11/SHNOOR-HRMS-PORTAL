import React from 'react';
import ReportCard from '../../../TeamLeader/Views/Reports/ReportCard';

const ReportsGrid = ({ onSelectReport }) => {
    const reports = [
        {
            id: 'attendance',
            title: 'Monthly Attendance Detail Report',
            description: 'Attendance summaries, late check-ins, absences, and attendance trends.',
            icon: 'fa-calendar-check',
            color: '#10b981'
        },
        {
            id: 'assignment',
            title: 'Monthly Assignment Detail Report',
            description: 'Assigned tasks, completed tasks, overdue tasks, and productivity trends.',
            icon: 'fa-list-check',
            color: '#8b5cf6'
        },
        {
            id: 'expense',
            title: 'Expense Detail Report',
            description: 'Expense submissions, reimbursement statuses, and approval trends.',
            icon: 'fa-file-invoice-dollar',
            color: '#f59e0b'
        },
        {
            id: 'payroll',
            title: 'Payroll Operational Report',
            description: 'Read-only payroll processing visibility, overtime, and reimbursement payouts.',
            icon: 'fa-money-check-dollar',
            color: '#ec4899'
        },
        
    ];

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ marginBottom: '0.5rem' }}>Reports & Insights Hub</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    Select a report to view detailed metrics, charts, and export options.
                </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {reports.map((report) => (
                    <ReportCard 
                        key={report.id}
                        title={report.title}
                        description={report.description}
                        icon={report.icon}
                        color={report.color}
                        onClick={() => onSelectReport(report.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ReportsGrid;

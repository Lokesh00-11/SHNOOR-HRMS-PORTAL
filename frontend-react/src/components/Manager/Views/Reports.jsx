import React, { useState } from 'react';
import ReportsGrid from './Reports/ReportsGrid';
import AttendanceReport from './Reports/AttendanceReport';
import ShiftReport from './Reports/ShiftReport';
import AssignmentReport from './Reports/AssignmentReport';
import ExpenseReport from './Reports/ExpenseReport';
import PayrollReport from './Reports/PayrollReport';
import LeaveReport from './Reports/LeaveReport';
import ProductivityReport from './Reports/ProductivityReport';
import OvertimeReport from './Reports/OvertimeReport';

const Reports = () => {
    const [activeReport, setActiveReport] = useState(null);

    const handleBack = () => {
        setActiveReport(null);
    };

    const renderActiveReport = () => {
        switch (activeReport) {
            case 'attendance':
                return <AttendanceReport onBack={handleBack} />;
            case 'shift':
                return <ShiftReport onBack={handleBack} />;
            case 'assignment':
                return <AssignmentReport onBack={handleBack} />;
            case 'expense':
                return <ExpenseReport onBack={handleBack} />;
            case 'payroll':
                return <PayrollReport onBack={handleBack} />;
            case 'leave':
                return <LeaveReport onBack={handleBack} />;
            case 'performance':
                return <ProductivityReport onBack={handleBack} />;
            case 'overtime':
                return <OvertimeReport onBack={handleBack} />;
            default:
                return <ReportsGrid onSelectReport={setActiveReport} />;
        }
    };

    return (
        <div className="reports-container fade-in">
            {renderActiveReport()}
        </div>
    );
};

export default Reports;

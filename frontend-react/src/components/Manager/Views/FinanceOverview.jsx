import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';
import FinanceTabs from './Finance/FinanceTabs';
import ExpenseFinancePanel from './Finance/ExpenseFinancePanel';
import PayrollFinancePanel from './Finance/PayrollFinancePanel';
import FinanceAnalyticsPanel from './Finance/FinanceAnalyticsPanel';
import FinanceReportsPanel from './Finance/FinanceReportsPanel';

const FinanceOverview = () => {
    const [teamExpenses, setTeamExpenses] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState('expenses');

    const fetchFinanceData = async () => {
        try {
            setLoading(true);
            const [expenseData, attendanceData] = await Promise.all([
                get('/manager/expenses/'),
                get('/manager/attendance/')
            ]);
            setTeamExpenses(expenseData || []);
            setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
        } catch (err) {
            console.error('Error loading department finance data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const stats = React.useMemo(() => {
        let total = 0, pending = 0, approved = 0, rejected = 0;
        teamExpenses.forEach(exp => {
            const amt = parseFloat(exp.amount) || 0;
            const stat = (exp.status || '').toUpperCase();
            total += amt;
            if (stat === 'PENDING') pending += amt;
            else if (stat === 'APPROVED') approved += amt;
            else if (stat === 'REJECTED') rejected += amt;
        });
        return { total, pending, approved, rejected };
    }, [teamExpenses]);

    const renderActivePanel = () => {
        switch (activeTab) {
            case 'expenses':
                return <ExpenseFinancePanel teamExpenses={teamExpenses} stats={stats} loading={loading} />;
            case 'payroll':
                return <PayrollFinancePanel />;
            case 'analytics':
                return <FinanceAnalyticsPanel stats={stats} />;
            case 'reports':
                return <FinanceReportsPanel teamExpenses={teamExpenses} />;
            default:
                return <ExpenseFinancePanel teamExpenses={teamExpenses} stats={stats} loading={loading} />;
        }
    };

    return (
        <section className="view-section active fade-in">
            <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Department Finance Overview</h2>
            
            <FinanceTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {renderActivePanel()}
        </section>
    );
};

export default FinanceOverview;

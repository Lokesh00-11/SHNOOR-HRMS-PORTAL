import React, { useState } from 'react';
import HelpdeskHub from '../components/Shared/Helpdesk/HelpdeskHub';
import Sidebar from '../components/Employee/Sidebar';
import ThemeToggle from '../components/Common/ThemeToggle';
import Dashboard from '../components/Employee/Views/Dashboard';
import Attendance from '../components/Employee/Views/Attendance';
import Tasks from '../components/Employee/Views/Tasks';
import Thanks from '../components/Employee/Views/Thanks';
import Leaves from '../components/Employee/Views/Leaves';
import Profile from '../components/Employee/Views/Profile';
import Notifications from '../components/Employee/Views/Notifications';
import Documents from '../components/Employee/Views/Documents';
import Holidays from '../components/Employee/Views/Holidays';
import Expenses from '../components/Employee/Views/Expenses';
import Offboarding from '../components/Employee/Views/Offboarding';
import OrgChart from '../components/Employee/Views/OrgChart';
import Assets from '../components/Employee/Views/Assets';
import Queries from '../components/Employee/Views/Queries';
import Payroll from '../components/Employee/Views/Payroll';
import MyRequests from '../components/Employee/Views/MyRequests';
import Authorizations from '../components/Employee/Views/Authorizations';
import PlannerPage from '../components/Planner/PlannerPage';

import '../styles/admin.css';

const EmployeeDashboard = () => {
    const [currentView, setCurrentView] = useState('dashboard');

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard />;
            case 'my-requests':
                return <MyRequests />;
            case 'authorizations':
                return <Authorizations />;
            case 'attendance':
                return <Attendance />;
            case 'leaves':
                return <Leaves />;
            case 'tasks':
                return <Tasks />;
            case 'thanks':
                return <Thanks />;
            case 'holidays':
                return <Holidays />;
            case 'assets':
                return <Assets />;
            case 'offboarding':
                return <Offboarding />;
            case 'orgchart':
                return <OrgChart />;
            case 'documents':
                return <Documents />;
            case 'expenses':
                return <Expenses />;
            case 'payroll':
                return <Payroll />;
            case 'queries':
                return <Queries />;
            case 'notifications':
                return <Notifications />;
            case 'profile':
                return <Profile />;
            case 'planner':
                return <PlannerPage role="employee" />;
            case 'helpdesk':
                return <HelpdeskHub role="employee" />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            
            <main className="main-content" style={{ position: 'relative' }}>
                <div className="dashboard-theme-toggle-container" style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '1rem',
                    zIndex: 100
                }}>
                    <ThemeToggle />
                </div>
                <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                    {renderView()}
                </div>
            </main>
        </div>
    );
};

export default EmployeeDashboard;


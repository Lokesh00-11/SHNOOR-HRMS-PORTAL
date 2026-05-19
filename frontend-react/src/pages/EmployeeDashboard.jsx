import React, { useState } from 'react';
import Sidebar from '../components/Employee/Sidebar';
import Dashboard from '../components/Employee/Views/Dashboard';
import Attendance from '../components/Employee/Views/Attendance';
import Tasks from '../components/Employee/Views/Tasks';
import Leaves from '../components/Employee/Views/Leaves';
import Profile from '../components/Employee/Views/Profile';
import Notifications from '../components/Employee/Views/Notifications';
import Documents from '../components/Employee/Views/Documents';
import Holidays from '../components/Employee/Views/Holidays';
import Expenses from '../components/Employee/Views/Expenses';
import Offboarding from '../components/Employee/Views/Offboarding';
import OrgChart from '../components/Employee/Views/OrgChart';
import PlannerPage from '../components/Planner/PlannerPage';

import '../styles/admin.css';

const EmployeeDashboard = () => {
    const [currentView, setCurrentView] = useState('dashboard');

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard />;
            case 'attendance':
                return <Attendance />;
            case 'leaves':
                return <Leaves />;
            case 'tasks':
                return <Tasks />;
            case 'holidays':
                return <Holidays />;
            case 'offboarding':
                return <Offboarding />;
            case 'orgchart':
                return <OrgChart />;
            case 'documents':
                return <Documents />;
            case 'expenses':
                return <Expenses />;
            case 'notifications':
                return <Notifications />;
            case 'profile':
                return <Profile />;
            case 'planner':
                return <PlannerPage role="employee" />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            
            <main className="main-content">
                <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                    {renderView()}
                </div>
            </main>
        </div>
    );
};

export default EmployeeDashboard;

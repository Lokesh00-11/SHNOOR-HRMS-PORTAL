import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Manager/Sidebar';
import Dashboard from '../components/Manager/Views/Dashboard';
import Employees from '../components/Manager/Views/Employees';
import ManageProfiles from '../components/Manager/Views/ManageProfiles';
import Attendance from '../components/Manager/Views/Attendance';
import Leaves from '../components/Manager/Views/Leaves';
import Tasks from '../components/Manager/Views/Tasks';
import Documents from '../components/Manager/Views/Documents';
import Profile from '../components/Manager/Views/Profile';
import Payroll from '../components/Manager/Views/Payroll';
import Expenses from '../components/Manager/Views/Expenses';
import Policies from '../components/Manager/Views/Policies';
import Offboarding from '../components/Manager/Views/Offboarding';
import LetterHeads from '../components/Manager/Views/LetterHeads';
import OrgChart from '../components/Manager/Views/OrgChart';
import Notifications from '../components/Manager/Views/Notifications';
import PlannerPage from '../components/Planner/PlannerPage';

import '../styles/admin.css';

const ManagerDashboard = () => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [currentMode, setCurrentMode] = useState('manager'); // 'manager' or 'self'

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
        }
    }, []);

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard currentMode={currentMode} />;
            case 'employees':
                return <Employees />;
            case 'manage-profiles':
                return <ManageProfiles />;
            case 'attendance':
                return <Attendance currentMode={currentMode} />;
            case 'leaves':
                return <Leaves currentMode={currentMode} />;
            case 'tasks':
                return <Tasks currentMode={currentMode} />;
            case 'documents':
                return <Documents />;
            case 'profile':
                return <Profile />;
            case 'payroll':
                return <Payroll />;
            case 'expenses':
                return <Expenses />;
            case 'policies':
                return <Policies currentMode={currentMode} />;
            case 'offboarding':
                return <Offboarding />;
            case 'letterheads':
                return <LetterHeads />;
            case 'orgchart':
                return <OrgChart />;
            case 'planner':
                return <PlannerPage role={currentMode} />;
            case 'notifications':
                return <Notifications currentMode={currentMode} />;
            default:
                return <Dashboard currentMode={currentMode} />;
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                currentMode={currentMode} 
                setCurrentMode={setCurrentMode} 
            />
            <main className="main-content" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {renderContent()}
            </main>
        </div>
    );
};

export default ManagerDashboard;

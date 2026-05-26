import React, { useState, useEffect } from 'react';
import Sidebar from '../components/TeamLeader/Sidebar';
import ThemeToggle from '../components/Common/ThemeToggle';
import Dashboard from '../components/TeamLeader/Views/Dashboard';
import TeamMembers from '../components/TeamLeader/Views/TeamMembers';
import Attendance from '../components/TeamLeader/Views/Attendance';
import Tasks from '../components/TeamLeader/Views/Tasks';
import Performance from '../components/TeamLeader/Views/Performance';
import Expenses from '../components/TeamLeader/Views/Expenses';
import Offboarding from '../components/TeamLeader/Views/Offboarding';
import Documents from '../components/TeamLeader/Views/Documents';
import Notifications from '../components/TeamLeader/Views/Notifications';
import Profile from '../components/TeamLeader/Views/Profile';
import PlannerPage from '../components/Planner/PlannerPage';
import Settings from '../components/TeamLeader/Views/Settings';
import FinanceOverview from '../components/TeamLeader/Views/FinanceOverview';
import Reports from '../components/TeamLeader/Views/Reports';

import '../styles/admin.css';

const TeamLeaderDashboard = () => {
    const [currentView, setCurrentView] = useState('dashboard');

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
        }
    }, []);

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard />;
            case 'team-members':
                return <TeamMembers />;
            case 'attendance':
                return <Attendance />;
            case 'tasks':
                return <Tasks />;
            case 'performance':
                return <Performance />;
            case 'expenses':
                return <Expenses />;
            case 'offboarding':
                return <Offboarding />;
            case 'documents':
                return <Documents />;
            case 'notifications':
                return <Notifications />;
            case 'profile':
                return <Profile />;
            case 'planner':
                return <PlannerPage role="team_leader" />;
            case 'settings':
                return <Settings />;
            case 'finance':
                return <FinanceOverview />;
            case 'reports':
                return <Reports />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
            />
            <main className="main-content" style={{ flex: 1, padding: '2rem', overflowY: 'auto', position: 'relative' }}>
                <div className="dashboard-theme-toggle-container" style={{
                    position: 'absolute',
                    top: '2rem',
                    right: '3rem',
                    zIndex: 100
                }}>
                    <ThemeToggle />
                </div>
                {renderContent()}
            </main>
        </div>
    );
};

export default TeamLeaderDashboard;

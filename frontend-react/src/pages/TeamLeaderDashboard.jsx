import React, { useState, useEffect } from 'react';
import Sidebar from '../components/TeamLeader/Sidebar';
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
import Queries from '../components/TeamLeader/Views/Queries';
import Cases from '../components/TeamLeader/Views/Cases';

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
            case 'queries':
                return <Queries />;
            case 'cases':
                return <Cases />;
            case 'notifications':
                return <Notifications />;
            case 'profile':
                return <Profile />;
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
            <main className="main-content" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {renderContent()}
            </main>
        </div>
    );
};

export default TeamLeaderDashboard;

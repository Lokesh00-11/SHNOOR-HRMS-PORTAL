import React, { useState } from 'react';
import HelpdeskHub from '../components/Shared/Helpdesk/HelpdeskHub';
import Sidebar from '../components/Admin/Sidebar';
import ThemeToggle from '../components/Common/ThemeToggle';
import SystemOverview from '../components/Admin/Views/SystemOverview';
import Companies from '../components/Admin/Views/Companies';
import Notifications from '../components/Admin/Views/Notifications';
import AdminSettingsLayout from '../components/Admin/Views/Settings/AdminSettingsLayout';
import Subscriptions from '../components/Admin/Views/Subscriptions';
import Transactions from '../components/Admin/Views/Transactions';
import EmailQueries from '../components/Admin/Views/EmailQueries';
import SuperAdmin from '../components/Admin/Views/SuperAdmin';
import OrgChart from '../components/Admin/Views/OrgChart';
import PlannerPage from '../components/Planner/PlannerPage';

import '../styles/admin.css';

const AdminDashboard = () => {
    const [currentView, setCurrentView] = useState('dashboard');

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <SystemOverview />;
            case 'companies':
                return <Companies />;
            case 'notifications':
                return <Notifications />;
            case 'system_settings':
                return <AdminSettingsLayout />;
            case 'subscriptions': 
                return <Subscriptions />;
            case 'transactions': 
                return <Transactions />;
            case 'emails': 
                return <EmailQueries />;
            case 'superadmin': 
                return <SuperAdmin />;
            case 'orgchart': 
                return <OrgChart />;
            case 'planner':
                return <PlannerPage role="admin" />;
            case 'helpdesk':
                return <HelpdeskHub role="admin" />;
            default:
                return <SystemOverview />;
        }
    };

    return (
        <div className="admin-layout">
            <div className="bg-glow-1"></div>
            <div className="bg-glow-2"></div>
            
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
                {renderView()}
            </main>
        </div>
    );
};

export default AdminDashboard;


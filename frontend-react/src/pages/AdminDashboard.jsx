import React, { useState } from 'react';
import Sidebar from '../components/Admin/Sidebar';
import SystemOverview from '../components/Admin/Views/SystemOverview';
import Companies from '../components/Admin/Views/Companies';
import Notifications from '../components/Admin/Views/Notifications';
import WebsiteSettings from '../components/Admin/Views/WebsiteSettings';
import AdminSettings from '../components/Admin/Views/AdminSettings';
import Subscriptions from '../components/Admin/Views/Subscriptions';
import Transactions from '../components/Admin/Views/Transactions';
import OfflineRequests from '../components/Admin/Views/OfflineRequests';
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
            case 'website':
                return <WebsiteSettings />;
            case 'settings':
                return <AdminSettings />;
            case 'subscriptions': 
                return <Subscriptions />;
            case 'transactions': 
                return <Transactions />;
            case 'offline': 
                return <OfflineRequests />;
            case 'emails': 
                return <EmailQueries />;
            case 'superadmin': 
                return <SuperAdmin />;
            case 'orgchart': 
                return <OrgChart />;
            case 'planner':
                return <PlannerPage role="admin" />;
            default:
                return <SystemOverview />;
        }
    };

    return (
        <div className="admin-layout">
            <div className="bg-glow-1"></div>
            <div className="bg-glow-2"></div>
            
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            
            <main className="main-content">
                {renderView()}
            </main>
        </div>
    );
};

export default AdminDashboard;

import React from 'react';
import ThemeToggle from '../Common/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
// Note: You may want to use a Link component if you switch to react-router-dom later.
// For now, we are using state-based navigation as requested.

const Sidebar = ({ currentView, setCurrentView }) => {
    const { theme } = useTheme();
    
    
    const menuItems = [
        { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
        { id: 'companies', icon: 'fa-building', label: 'Companies' },
        { id: 'subscriptions', icon: 'fa-receipt', label: 'Subscriptions' },
        { id: 'transactions', icon: 'fa-money-bill-transfer', label: 'Transactions' },
        { id: 'superadmin', icon: 'fa-user-shield', label: 'Super Admin' },
        { id: 'orgchart', icon: 'fa-sitemap', label: 'Org Chart' },
        { id: 'planner', icon: 'fa-calendar-days', label: 'Planner' },
        { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
        { id: 'system_settings', icon: 'fa-server', label: 'Settings' },
        { id: 'helpdesk', label: 'Helpdesk', icon: 'fa-headset' },
    ];

    return (
        <aside className="sidebar">
            <a href="#" className="logo">
                <i className="fa-solid fa-layer-group" style={{ color: 'var(--primary)' }}></i> ShnoorHR
            </a>
            
            {menuItems.map(item => (
                <div 
                    key={item.id}
                    className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                    onClick={() => setCurrentView(item.id)}
                    style={{ cursor: 'pointer' }}
                >
                    <i className={`fa-solid ${item.icon}`}></i> {item.label}
                </div>
            ))}
            
            <div style={{ flex: 1 }}></div>

            {/* Premium Theme Mode Switcher */}


            <a href="/login" className="nav-item" style={{ color: '#f43f5e', textDecoration: 'none', padding: '0.75rem 1rem' }}>
                <i className="fa-solid fa-right-from-bracket"></i> Logout
            </a>
        </aside>
    );
};

export default Sidebar;



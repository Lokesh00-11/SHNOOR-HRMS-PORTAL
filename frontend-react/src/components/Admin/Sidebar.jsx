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
        { id: 'offline', icon: 'fa-file-invoice', label: 'Offline Requests' },
        { id: 'emails', icon: 'fa-envelope', label: 'Email Queries' },
        { id: 'superadmin', icon: 'fa-user-shield', label: 'Super Admin' },
        { id: 'orgchart', icon: 'fa-sitemap', label: 'Org Chart' },
        { id: 'planner', icon: 'fa-calendar-days', label: 'Planner' },
        { id: 'website', icon: 'fa-globe', label: 'Website Settings' },
        { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
        { id: 'settings', icon: 'fa-gear', label: 'Settings' },
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
            <div className="sidebar-theme-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                margin: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)'
            }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-circle-half-stroke" style={{ color: 'var(--primary-color)' }}></i> Theme Mode
                </span>
                <ThemeToggle />
            </div>

            <a href="/login" className="nav-item" style={{ color: '#f43f5e', textDecoration: 'none', padding: '0.75rem 1rem' }}>
                <i className="fa-solid fa-right-from-bracket"></i> Logout
            </a>
        </aside>
    );
};

export default Sidebar;

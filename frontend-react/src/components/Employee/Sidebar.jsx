import React from 'react';
import ThemeToggle from '../Common/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = ({ currentView, setCurrentView }) => {
    const { theme } = useTheme();
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge' },
        { id: 'attendance', label: 'Attendance', icon: 'fa-calendar-check' },
        { id: 'leaves', label: 'Leaves', icon: 'fa-umbrella-beach' },
        { id: 'tasks', label: 'Tasks', icon: 'fa-list-check' },
        { id: 'holidays', label: 'Holidays', icon: 'fa-tree' },
        { id: 'offboarding', label: 'Offboarding', icon: 'fa-user-xmark' },
        { id: 'orgchart', label: 'Org Chart', icon: 'fa-sitemap' },
        { id: 'documents', label: 'Documents', icon: 'fa-folder-open' },
        { id: 'expenses', label: 'Expenses', icon: 'fa-wallet' },
        { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
        { id: 'profile', label: 'Profile', icon: 'fa-user' },
        { id: 'planner', label: 'Planner', icon: 'fa-calendar-days' },
    ];

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <aside className="sidebar">
            <div className="logo" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-layer-group"></i>
                ShnoorHR
            </div>
            
            <nav style={{ flex: 1, overflowY: 'auto' }}>
                {navItems.map(item => (
                    <div 
                        key={item.id}
                        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                        onClick={() => setCurrentView(item.id)}
                    >
                        <i className={`fa-solid ${item.icon}`}></i>
                        {item.label}
                    </div>
                ))}
            </nav>

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

            <div className="nav-item logout" onClick={handleLogout} style={{ color: '#f43f5e', borderTop: '1px solid var(--bg-tertiary)', marginTop: '0.5rem', paddingTop: '1.5rem' }}>
                <i className="fa-solid fa-right-from-bracket"></i>
                Logout
            </div>
        </aside>
    );
};

export default Sidebar;

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
        { id: 'helpdesk', label: 'Helpdesk', icon: 'fa-headset' },
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



            <div className="nav-item logout" onClick={handleLogout} style={{ color: '#f43f5e', borderTop: '1px solid var(--bg-tertiary)', marginTop: '0.5rem', paddingTop: '1.5rem' }}>
                <i className="fa-solid fa-right-from-bracket"></i>
                Logout
            </div>
        </aside>
    );
};

export default Sidebar;



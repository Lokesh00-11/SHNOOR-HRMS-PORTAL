import React from 'react';
import ThemeToggle from '../Common/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = ({ currentView, setCurrentView, currentMode, setCurrentMode }) => {
    const { theme } = useTheme();
    

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
        { id: 'team-members', label: 'Team Members', icon: 'fa-users' },
        { id: 'attendance', label: 'Attendance', icon: 'fa-calendar-check' },
        { id: 'tasks', label: 'Team Tasks', icon: 'fa-list-check' },
        { id: 'performance', label: 'Performance', icon: 'fa-chart-line' },
        { id: 'expenses', label: 'Team Expenses', icon: 'fa-wallet' },
        { id: 'finance', label: 'Finance', icon: 'fa-file-invoice-dollar' },
        { id: 'reports', label: 'Reports', icon: 'fa-chart-simple' },
        { id: 'offboarding', label: 'Offboarding', icon: 'fa-user-xmark' },
        { id: 'documents', label: 'Documents', icon: 'fa-folder-open' },
        { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
        { id: 'profile', label: 'Profile', icon: 'fa-user-gear' },
        { id: 'planner', label: 'Planner', icon: 'fa-calendar-days' },
        { id : 'settings', label: 'Settings', icon: 'fa-gear' },
        { id: 'helpdesk', label: 'Helpdesk', icon: 'fa-headset' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        window.location.href = '/login';
    };

    return (
        <aside className="sidebar">
            <a href="#" className="logo" style={{ textDecoration: 'none', marginBottom: '2rem' }}>
                <i className="fa-solid fa-users" style={{ color: 'var(--primary)', marginRight: '10px' }}></i> 
                ShnoorHR
            </a>

            <div className="nav-items-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
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
            </div>



            <div style={{ padding: '0 0.75rem 1rem' }}>
                <button 
                    onClick={handleLogout} 
                    className="nav-item" 
                    style={{ 
                        color: '#f43f5e', 
                        background: 'transparent', 
                        border: 'none', 
                        width: '100%', 
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem'
                    }}
                >
                    <i className="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;



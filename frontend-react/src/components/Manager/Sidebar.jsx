import React from 'react';
import ThemeToggle from '../Common/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = ({ currentView, setCurrentView, currentMode, setCurrentMode }) => {
    const { theme } = useTheme();
    
    // visible hk
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', visibleFor: ['manager', 'self'] },
        { id: 'employees', label: 'Employees', icon: 'fa-users', visibleFor: ['manager'] },
        { id: 'manage-profiles', label: 'Manage Profiles', icon: 'fa-id-card', visibleFor: ['manager'] },
        { id: 'attendance', label: 'Attendance', icon: 'fa-calendar-check', visibleFor: ['manager', 'self'] },
        { id: 'leaves', label: 'Leaves', icon: 'fa-umbrella-beach', visibleFor: ['manager', 'self'] },
        { id: 'tasks', label: 'Tasks', icon: 'fa-list-check', visibleFor: ['manager'] },
        { id: 'documents', label: 'Documents', icon: 'fa-folder-open', visibleFor: ['self'] },
        { id: 'profile', label: 'Profile', icon: 'fa-user', visibleFor: ['self'] },
        { id: 'payroll', label: 'Payroll', icon: 'fa-file-invoice-dollar', visibleFor: ['manager'] },
        { id: 'expenses', label: 'Expenses', icon: 'fa-wallet', visibleFor: ['manager'] },
        { id: 'finance', label: 'Finance Overview', icon: 'fa-money-bill-trend-up', visibleFor: ['manager'] },
        { id: 'policies', label: 'Company Policies', icon: 'fa-file-shield', visibleFor: ['manager', 'self'] },
        { id: 'reports', label: 'Reports & Insights', icon: 'fa-chart-line', visibleFor: ['manager'] },
        { id: 'offboarding', label: 'Offboarding', icon: 'fa-user-xmark', visibleFor: ['manager'] },
        { id: 'letterheads', label: 'Letter Heads', icon: 'fa-file-signature', visibleFor: ['manager'] },
        { id: 'orgchart', label: 'Org Chart', icon: 'fa-sitemap', visibleFor: ['manager', 'self'] },
        { id: 'planner', label: 'Planner', icon: 'fa-calendar-days', visibleFor: ['manager', 'self'] },
        { id: 'notifications', label: 'Notifications', icon: 'fa-bell', visibleFor: ['manager', 'self'] },
        { id: 'settings', label: 'Settings', icon: 'fa-gear', visibleFor: ['manager', 'self'] },
        { id: 'helpdesk', label: 'Helpdesk', icon: 'fa-headset', visibleFor: ['manager', 'self'] },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        window.location.href = '/login';
    };

    // Filter 
    const visibleItems = menuItems.filter(item => item.visibleFor.includes(currentMode));

    return (
        <aside className="sidebar">
            <a href="#" className="logo" style={{ textDecoration: 'none' }}>
                <i className="fa-solid fa-user-tie" style={{ color: 'var(--primary)', marginRight: '10px' }}></i> 
                ShnoorHR
            </a>

            {/* Toggle inside Sidebar */}
            <div style={{
                display: 'flex', 
                gap: '0.25rem', 
                margin: '1rem 0.75rem 1.5rem', 
                background: 'rgba(255,255,255,0.05)', 
                padding: '0.25rem', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <button 
                    className={`btn ${currentMode === 'self' ? 'btn-primary' : 'btn-ghost'}`} 
                    onClick={() => {
                        setCurrentMode('self');
                        // Reset 
                        setCurrentView('dashboard');
                    }}
                    style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', minWidth: 0 }}
                >
                    Self
                </button>
                <button 
                    className={`btn ${currentMode === 'manager' ? 'btn-primary' : 'btn-ghost'}`} 
                    onClick={() => {
                        setCurrentMode('manager');
                        setCurrentView('dashboard');
                    }}
                    style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', minWidth: 0 }}
                >
                    Manager
                </button>
            </div>

            <div className="nav-items-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                {visibleItems.map(item => (
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



import React, { useState, useEffect } from 'react';
import { useBadges } from '../../context/BadgeContext';

const Sidebar = ({ currentView, setCurrentView }) => {
    const { badgeCounts, markAsRead } = useBadges();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
        { id: 'team-members', label: 'Team Members', icon: 'fa-users' },
        { id: 'attendance', label: 'Attendance', icon: 'fa-calendar-check' },
        { id: 'tasks', label: 'Team Tasks', icon: 'fa-list-check' },
        { id: 'performance', label: 'Performance', icon: 'fa-chart-line' },
        { id: 'expenses', label: 'Team Expenses', icon: 'fa-wallet' },
        { id: 'offboarding', label: 'Offboarding', icon: 'fa-user-xmark' },
        { id: 'documents', label: 'Documents', icon: 'fa-folder-open' },
        { id: 'queries', label: 'Team Queries', icon: 'fa-circle-question' },
        { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
        { id: 'profile', label: 'Profile', icon: 'fa-user-gear' }
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
                <i className="fa-solid fa-users-gear" style={{ color: 'var(--primary)', marginRight: '10px' }}></i> 
                ShnoorHR
            </a>

            <div className="nav-items-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                {menuItems.map(item => (
                    <div
                        key={item.id}
                        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                        onClick={() => {
                            setCurrentView(item.id);
                            if (['expenses', 'queries', 'tasks', 'notifications'].includes(item.id)) {
                                markAsRead(item.id);
                            }
                        }}
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <div><i className={`fa-solid ${item.icon}`}></i> {item.label}</div>
                        {badgeCounts[item.id] > 0 && (
                            <span style={{
                                background: '#ef4444', color: 'white', padding: '2px 8px', 
                                borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold'
                            }}>
                                {badgeCounts[item.id]}
                            </span>
                        )}
                    </div>
                ))}
            </div>

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
                <button 
                    onClick={toggleTheme}
                    className="theme-toggle-btn"
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-main)',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {theme === 'dark' ? (
                        <i className="fa-solid fa-sun" style={{ color: '#f59e0b' }}></i>
                    ) : (
                        <i className="fa-solid fa-moon" style={{ color: '#6366f1' }}></i>
                    )}
                </button>
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

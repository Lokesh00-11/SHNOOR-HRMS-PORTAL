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
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge' },
        { id: 'attendance', label: 'Attendance', icon: 'fa-calendar-check' },
        { id: 'leaves', label: 'Leaves', icon: 'fa-umbrella-beach' },
        { id: 'tasks', label: 'Tasks', icon: 'fa-list-check' },
        { id: 'thanks', label: 'Thanks', icon: 'fa-thumbs-up' },
        { id: 'holidays', label: 'Holidays', icon: 'fa-tree' },
        { id: 'offboarding', label: 'Offboarding', icon: 'fa-user-xmark' },
        { id: 'orgchart', label: 'Org Chart', icon: 'fa-sitemap' },
        { id: 'documents', label: 'Documents', icon: 'fa-folder-open' },
        { id: 'expenses', label: 'Expenses', icon: 'fa-wallet' },
        { id: 'payroll', label: 'Payroll', icon: 'fa-file-invoice-dollar' },
        { id: 'queries', label: 'Queries', icon: 'fa-circle-question' },
        { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
        { id: 'profile', label: 'Profile', icon: 'fa-user' },
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
                        onClick={() => {
                            setCurrentView(item.id);
                            if (['leaves', 'expenses', 'queries', 'tasks', 'notifications', 'payroll', 'thanks', 'offboarding'].includes(item.id)) {
                                markAsRead(item.id);
                            }
                        }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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

            <div className="nav-item logout" onClick={handleLogout} style={{ color: '#f43f5e', borderTop: '1px solid var(--bg-tertiary)', marginTop: '0.5rem', paddingTop: '1.5rem' }}>
                <i className="fa-solid fa-right-from-bracket"></i>
                Logout
            </div>
        </aside>
    );
};

export default Sidebar;

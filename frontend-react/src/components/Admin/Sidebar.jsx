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
        { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
        { id: 'companies', icon: 'fa-building', label: 'Companies' },
        { id: 'subscriptions', icon: 'fa-receipt', label: 'Subscriptions' },
        { id: 'transactions', icon: 'fa-money-bill-transfer', label: 'Transactions' },
        { id: 'offline', icon: 'fa-file-invoice', label: 'Offline Requests' },
        { id: 'emails', icon: 'fa-envelope', label: 'Email Queries' },
        { id: 'superadmin', icon: 'fa-user-shield', label: 'Super Admin' },
        { id: 'orgchart', icon: 'fa-sitemap', label: 'Org Chart' },
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
                    onClick={() => {
                        setCurrentView(item.id);
                        if (['emails', 'notifications', 'transactions'].includes(item.id)) {
                            markAsRead(item.id === 'emails' ? 'queries' : item.id);
                        }
                    }}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <div><i className={`fa-solid ${item.icon}`}></i> {item.label}</div>
                    {((item.id === 'emails' && badgeCounts.queries > 0) || (item.id === 'notifications' && badgeCounts.notifications > 0) || (item.id === 'transactions' && badgeCounts.transactions > 0)) && (
                        <span style={{
                            background: '#ef4444', color: 'white', padding: '2px 8px', 
                            borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold'
                        }}>
                            {item.id === 'emails' ? badgeCounts.queries : (item.id === 'transactions' ? badgeCounts.transactions : badgeCounts.notifications)}
                        </span>
                    )}
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

            <a href="/login" className="nav-item" style={{ color: '#f43f5e', textDecoration: 'none', padding: '0.75rem 1rem' }}>
                <i className="fa-solid fa-right-from-bracket"></i> Logout
            </a>
        </aside>
    );
};

export default Sidebar;

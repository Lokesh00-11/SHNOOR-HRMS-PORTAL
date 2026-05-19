import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button 
            onClick={toggleTheme}
            className={`theme-toggle-btn ${className}`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
                background: 'var(--bg-tertiary, rgba(255, 255, 255, 0.08))',
                border: '1px solid var(--border-color, var(--glass-border))',
                color: 'var(--text-primary)',
                padding: '0.5rem 0.85rem',
                borderRadius: '30px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'var(--shadow-sm)'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = 'var(--primary-color)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
        >
            {theme === 'dark' ? (
                <>
                    <i className="fa-solid fa-sun" style={{ color: '#f59e0b', transition: 'transform 0.5s ease', transform: 'rotate(0deg)' }}></i>
                    <span style={{ fontSize: '0.8rem' }}>Light Mode</span>
                </>
            ) : (
                <>
                    <i className="fa-solid fa-moon" style={{ color: '#6366f1', transition: 'transform 0.5s ease', transform: 'rotate(360deg)' }}></i>
                    <span style={{ fontSize: '0.8rem' }}>Dark Mode</span>
                </>
            )}
        </button>
    );
};

export default ThemeToggle;

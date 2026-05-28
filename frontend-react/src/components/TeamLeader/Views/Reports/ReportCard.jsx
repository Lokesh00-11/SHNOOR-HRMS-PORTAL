import React from 'react';

const ReportCard = ({ title, description, icon, color, onClick }) => {
    return (
        <div 
            className="glass-panel report-card" 
            onClick={onClick}
            style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                cursor: 'pointer', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                transition: 'transform 0.2s, box-shadow 0.2s', 
                border: '1px solid var(--glass-border)',
                height: '100%'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: `${color}15`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.5rem', 
                color: color
            }}>
                <i className={`fa-solid ${icon}`} style={{ fontSize: '2.5rem' }}></i>
            </div>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{title}</h4>
            <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {description}
            </p>
        </div>
    );
};

export default ReportCard;

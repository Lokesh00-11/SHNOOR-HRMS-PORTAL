import React from 'react';

const WebsiteSettings = () => {
    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Website Settings</h2>
            <div className="settings-container">
                <div className="setting-item">
                    <h4>Site Title</h4>
                    <input type="text" value="Shnoor HRM" disabled style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', padding: '0.75rem', borderRadius: '8px' }} />
                </div>
                <div className="setting-item">
                    <h4>Primary Color</h4>
                    <input type="color" value="#3b82f6" disabled style={{ border: 'none', background: 'transparent' }} />
                </div>
                <div className="setting-item">
                    <h4>Secondary Color</h4>
                    <input type="color" value="#10b981" disabled style={{ border: 'none', background: 'transparent' }} />
                </div>
                <div className="setting-item">
                    <h4>Font Family</h4>
                    <select disabled style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', padding: '0.75rem', borderRadius: '8px' }}>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                    </select>
                </div>
            </div>
        </section>
    );
};

export default WebsiteSettings;

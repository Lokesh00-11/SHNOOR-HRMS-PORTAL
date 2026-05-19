import React from 'react';

const AdminSettings = () => {
    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Admin Settings</h2>
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <h4 style={{ marginBottom: '1rem' }}>Profile Settings</h4>
                        <div className="form-group">
                            <label>Admin Username</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value="admin" 
                                readOnly 
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', opacity: 0.7 }} 
                            />
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Changes</button>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '1rem' }}>System Security</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <span>Two-Factor Authentication</span>
                            <span className="status inactive" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' }}>
                                Disabled
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AdminSettings;

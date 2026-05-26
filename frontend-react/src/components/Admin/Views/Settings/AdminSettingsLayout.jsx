import React, { useState, useEffect } from 'react';
import { adminSettingsService } from '../../../../services/adminSettingsService';
import '../../../../styles/settings.css'; 


const GenericSettingsPanel = ({ title, description, settingsData, onSave, loading, onChange }) => {
    return (
        <div className="settings-card">
            <div className="settings-card-header">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-circle-notch fa-spin"></i> Loading...
                </div>
            ) : (
                <form onSubmit={onSave} className="settings-grid">
                    {Object.keys(settingsData).map(key => {
                        if (typeof settingsData[key] === 'boolean') {
                            return (
                                <div className="settings-switch-row" key={key} style={{ gridColumn: '1 / -1' }}>
                                    <div className="settings-switch-info">
                                        <h4 className="settings-switch-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                                    </div>
                                    <label className="settings-switch">
                                        <input
                                            type="checkbox"
                                            checked={settingsData[key]}
                                            onChange={(e) => onChange(key, e.target.checked)}
                                        />
                                        <span className="settings-slider"></span>
                                    </label>
                                </div>
                            );
                        } else if (typeof settingsData[key] === 'string' || typeof settingsData[key] === 'number') {
                            return (
                                <div className="setting-field" key={key}>
                                    <label>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                                    <input 
                                        type={typeof settingsData[key] === 'number' ? 'number' : 'text'}
                                        value={settingsData[key]}
                                        onChange={(e) => onChange(key, typeof settingsData[key] === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)' }}
                                    />
                                </div>
                            );
                        }
                        return null; 
                    })}
                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Save Changes</button>
                    </div>
                </form>
            )}
        </div>
    );
};

const AdminSettingsLayout = () => {
    const [activeTab, setActiveTab] = useState('organization');
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const tabs = [
        { id: 'organization', icon: 'fa-building', label: 'Organization' },
        { id: 'security', icon: 'fa-shield', label: 'Security' },
        { id: 'expenses', icon: 'fa-file-invoice', label: 'Expenses' },
        { id: 'branding', icon: 'fa-palette', label: 'Branding & UI' },
        { id: 'maintenance', icon: 'fa-screwdriver-wrench', label: 'Maintenance' },
    ];

    useEffect(() => {
        if (activeTab !== 'rbac') {
            loadData(activeTab);
        }
    }, [activeTab]);

    const loadData = async (tab) => {
        setLoading(true);
        try {
            const serviceMap = {
                organization: adminSettingsService.getOrganization,
                security: adminSettingsService.getSecurity,
                notifications: adminSettingsService.getNotifications,
                attendance: adminSettingsService.getAttendance,
                expenses: adminSettingsService.getExpenses,
                tasks: adminSettingsService.getTasks,
                branding: adminSettingsService.getBranding,
                lifecycle: adminSettingsService.getLifecycle,
                maintenance: adminSettingsService.getMaintenance,
            };
            if (serviceMap[tab]) {
                const result = await serviceMap[tab]();
                setData(result);
            }
        } catch (error) {
            console.error("Failed to load settings");
        }
        setLoading(false);
    };

    const handleChange = (key, value) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const updateMap = {
                organization: adminSettingsService.updateOrganization,
                security: adminSettingsService.updateSecurity,
                notifications: adminSettingsService.updateNotifications,
                attendance: adminSettingsService.updateAttendance,
                expenses: adminSettingsService.updateExpenses,
                tasks: adminSettingsService.updateTasks,
                branding: adminSettingsService.updateBranding,
                lifecycle: adminSettingsService.updateLifecycle,
                maintenance: adminSettingsService.updateMaintenance,
            };
            if (updateMap[activeTab]) {
                await updateMap[activeTab](data);
                triggerToast('Settings saved successfully.');
            }
        } catch (error) {
            triggerToast('Error saving settings.');
        }
    };

    return (
        <section className="view-section active">
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>System Settings</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Enterprise centralized configuration, RBAC, and security settings.
                </p>
            </div>

            <div className="settings-layout">
                {/* Sidebar Navigation */}
                <div className="settings-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <i className={`fa-solid ${tab.icon}`}></i>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Panel */}
                <div className="settings-content-panel">
                    {activeTab !== 'rbac' ? (
                        <GenericSettingsPanel
                            title={`${tabs.find(t => t.id === activeTab)?.label} Configuration`}
                            description={`Manage properties related to ${activeTab}.`}
                            settingsData={data}
                            onChange={handleChange}
                            onSave={handleSave}
                            loading={loading}
                        />
                    ) : (
                        <div className="settings-card">
                            <div className="settings-card-header">
                                <h3>Role-Based Access Control (RBAC)</h3>
                                <p>Manage scalable, standalone roles and permissions for the enterprise modules.</p>
                            </div>
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <i className="fa-solid fa-hammer" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
                                <h4>Advanced RBAC Engine Active</h4>
                                <p>Roles and Permissions tables are instantiated. UI Management interface is scalable for upcoming multi-tenant logic.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Notification */}
            {showToast && (
                <div className="settings-toast">
                    <i className="fa-solid fa-circle-check" style={{ color: 'var(--success-color)', fontSize: '1.2rem' }}></i>
                    <span>{toastMessage}</span>
                </div>
            )}
        </section>
    );
};

export default AdminSettingsLayout;

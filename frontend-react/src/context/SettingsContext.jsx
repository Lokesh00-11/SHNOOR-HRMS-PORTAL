import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminSettingsService } from '../services/adminSettingsService';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        organization: null,
        branding: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalSettings = async () => {
            try {
                // Fetch only the settings necessary for global UI wrapping to keep it extremely lightweight
                const orgData = await adminSettingsService.getOrganization();
                const brandData = await adminSettingsService.getBranding();
                
                setSettings({
                    organization: orgData,
                    branding: brandData
                });

                // Dynamically inject branding configurations into global CSS variables
                if (brandData && brandData.primary_color) {
                    // Make sure it applies to the root element for global propagation
                    document.documentElement.style.setProperty('--primary-color', brandData.primary_color);
                }
                
                // Fallback safe mechanism for document title
                if (orgData && orgData.company_name) {
                    document.title = `${orgData.company_name} | HRMS`;
                }

            } catch (error) {
                console.error("SettingsProvider: Failed to load global settings. Falling back to defaults.", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalSettings();
    }, []);

    // Prevent aggressive re-rendering of the entire app while settings are initially fetching
    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ color: 'var(--primary-color)', fontSize: '2rem' }}></i>
        </div>;
    }

    return (
        <SettingsContext.Provider value={{ settings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

const BASE_URL = 'http://127.0.0.1:8000/api/settings/';

// Helper to get auth headers (assuming Token auth based on settings.py)
const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
    } : {
        'Content-Type': 'application/json'
    };
};

const getSetting = async (moduleName) => {
    try {
        const response = await fetch(`${BASE_URL}${moduleName}/`, { 
            method: 'GET',
            headers: getHeaders(),
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${moduleName} settings:`, error);
        throw error;
    }
};

const updateSetting = async (moduleName, data) => {
    try {
        const response = await fetch(`${BASE_URL}${moduleName}/`, { 
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error(`Error updating ${moduleName} settings:`, error);
        throw error;
    }
};

export const adminSettingsService = {
    getOrganization: () => getSetting('organization'),
    updateOrganization: (data) => updateSetting('organization', data),
    
    getSecurity: () => getSetting('security'),
    updateSecurity: (data) => updateSetting('security', data),
    
    getNotifications: () => getSetting('notifications'),
    updateNotifications: (data) => updateSetting('notifications', data),
    
    getAttendance: () => getSetting('attendance'),
    updateAttendance: (data) => updateSetting('attendance', data),
    
    getExpenses: () => getSetting('expenses'),
    updateExpenses: (data) => updateSetting('expenses', data),
    
    getTasks: () => getSetting('tasks'),
    updateTasks: (data) => updateSetting('tasks', data),
    
    getBranding: () => getSetting('branding'),
    updateBranding: (data) => updateSetting('branding', data),
    
    getLifecycle: () => getSetting('lifecycle'),
    updateLifecycle: (data) => updateSetting('lifecycle', data),
    
    getMaintenance: () => getSetting('maintenance'),
    updateMaintenance: (data) => updateSetting('maintenance', data),
};

export const API_BASE = 'http://127.0.0.1:8000/api';

export const getToken = () => localStorage.getItem('token');

export const getHeaders = (isFormData = false) => {
    const headers = {};
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    return headers;
};

export async function get(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: getHeaders()
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 && errorData.subscription_blocked) {
            window.dispatchEvent(new CustomEvent('subscription-blocked', { detail: errorData }));
        }
        throw new Error(errorData.message || `GET request failed: ${response.statusText}`);
    }
    return response.json();
}

export async function post(endpoint, data) {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(isFormData),
        body: isFormData ? data : JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 && errorData.subscription_blocked) {
            window.dispatchEvent(new CustomEvent('subscription-blocked', { detail: errorData }));
        }
        throw new Error(errorData.message || `POST request failed: ${response.statusText}`);
    }
    return response.json();
}

export async function patch(endpoint, data) {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
        headers: getHeaders(isFormData),
        body: isFormData ? data : JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 && errorData.subscription_blocked) {
            window.dispatchEvent(new CustomEvent('subscription-blocked', { detail: errorData }));
        }
        throw new Error(errorData.message || `PATCH request failed: ${response.statusText}`);
    }
    return response.json();
}

export async function put(endpoint, data) {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(isFormData),
        body: isFormData ? data : JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 && errorData.subscription_blocked) {
            window.dispatchEvent(new CustomEvent('subscription-blocked', { detail: errorData }));
        }
        throw new Error(errorData.message || (Object.keys(errorData).length > 0 ? JSON.stringify(errorData) : `PUT request failed: ${response.statusText}`));
    }
    return response.json();
}

export async function del(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 && errorData.subscription_blocked) {
            window.dispatchEvent(new CustomEvent('subscription-blocked', { detail: errorData }));
        }
        throw new Error(errorData.message || `DELETE request failed: ${response.statusText}`);
    }
    if (response.status === 204) return null;
    return response.json().catch(() => null);
}

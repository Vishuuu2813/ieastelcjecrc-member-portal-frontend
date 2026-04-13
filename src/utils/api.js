// src/utils/api.js
export const API_BASE_URL = 'http://localhost:5000';

// Added this: Helper to get the token quickly
export const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Added this: Helper to get the user object
export const getAuthUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const setAuthSession = (data) => {
    if (data && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    } else {
        clearAuthSession();
    }
};

export const clearAuthSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

export const apiFetch = async (endpoint, options = {}) => {
    const { method = 'GET', body, auth = true } = options;
    const token = getAuthToken(); // Use our new helper here!

    const headers = {
        'Content-Type': 'application/json',
    };

    if (auth && token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    
    if (response.status === 401) {
        clearAuthSession();
    }

    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    return data;
};

// src/utils/api.js

// ... keep all your previous exports (API_BASE_URL, getAuthToken, apiFetch, etc.)

/**
 * Uploads an offer PDF (Requested by ManageOffers.jsx)
 * @param {string} offerId - The ID of the offer
 * @param {File} file - The actual PDF file object
 */
export const apiUploadOfferPdf = async (offerId, file) => {
    const formData = new FormData();
    formData.append('pdf', file);

    const token = getAuthToken();
    
    // We don't use apiFetch here because file uploads need 
    // different headers than our standard JSON calls.
    const response = await fetch(`${API_BASE_URL}/api/offers/${offerId}/pdf`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            // IMPORTANT: Do NOT set Content-Type here; 
            // the browser will set it to multipart/form-data automatically.
        },
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');
    return data;
};

export const apiDeleteOfferPdf = async (offerId, publicId) => {
    return await apiFetch(`/api/offers/${offerId}/pdf`, {
        method: 'DELETE',
        body: { publicId }
    });
};

export const apiUpdateOffer = async (offerId, updateData) => {
    return await apiFetch(`/api/offers/${offerId}`, {
        method: 'PUT',
        body: updateData
    });
};
import api from './api';

export const login = async (username, password) => {
    try {
        const response = await api.post('auth/login', { username, password }); // FIXED: Removed leading slash for correct path resolution
        const { token, profile } = response.data;

        // Save to localStorage as requested // UPDATED
        localStorage.setItem('token', token);
        localStorage.setItem('profile', JSON.stringify(profile));

        return profile;
    } catch (error) {
        // Throw error for component to catch // UPDATED
        throw error.response?.data?.message || 'Login failed. Please check your credentials.';
    }
};

export const register = async (userData) => {
    try {
        // UPDATED: Path matches ProfilesController in backend
        const response = await api.post('profiles/register', userData);
        return response.data; // Return data from the successful registration
    } catch (error) {
        throw error.response?.data?.message || 'Registration failed. Please try again.';
    }
};

export const getRegistrations = async () => {
    try {
        const response = await api.get('profiles/registrations');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch registrations';
    }
};

export const approveRegistration = async (id, approvalData) => {
    try {
        const response = await api.put(`profiles/registrations/${id}/approve`, approvalData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Approval failed';
    }
};

export const rejectRegistration = async (id, reason = "") => {
    try {
        const response = await api.put(`profiles/registrations/${id}/reject`, { reason });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Rejection failed';
    }
};

export const getAllProfiles = async () => {
    try {
        const response = await api.get('profiles');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch profiles';
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
};

export const getProfile = () => {
    const profile = localStorage.getItem('profile');
    return profile ? JSON.parse(profile) : null;
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const isLoggedIn = () => {
    return !!localStorage.getItem('token');
};

export default { login, register, getRegistrations, approveRegistration, rejectRegistration, getAllProfiles, logout, getProfile, getToken, isLoggedIn };
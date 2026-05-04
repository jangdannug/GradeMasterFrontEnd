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

export default { login, logout, getProfile, getToken, isLoggedIn };
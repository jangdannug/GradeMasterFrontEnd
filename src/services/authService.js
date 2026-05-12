import api from './api';

// Helper to bridge database naming conventions to frontend camelCase
const normalizeProfile = (p) => {
    if (!p) return null;
    return {
        ...p,
        id: p.id || p.Id,
        name: p.name || p.Name,
        username: p.username || p.Username,
        role: p.role || p.Role,
        assignedSectionId: p.assignedSectionId || p.AssignedSectionId || p.assigned_section_id,
        assignedSubjectIds: p.assignedSubjectIds || p.AssignedSubjectIds || p.assigned_subject_ids || [],
        schoolId: p.schoolId || p.SchoolId || p.school_id,
        schoolName: p.schoolName || p.SchoolName || p.school_name
    };
};

export const login = async (username, password) => {
    try {
        const response = await api.post('auth/login', { username, password }); // FIXED: Removed leading slash for correct path resolution
        const { token, profile: rawProfile } = response.data;
        const profile = normalizeProfile(rawProfile);

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
        const response = await api.put(`profiles/registrations/${String(id)}/approve`, approvalData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Approval failed';
    }
};

export const rejectRegistration = async (id, reason = "") => {
    try {
        const response = await api.put(`profiles/registrations/${String(id)}/reject`, { reason });
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

export const deleteProfile = async (id) => {
    try {
        const response = await api.delete(`profiles/${String(id)}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to delete profile';
    }
};

export const updateProfile = async (id, userData) => {
    try {
        const response = await api.put(`profiles/${String(id)}`, userData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update profile';
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
};

export const getProfile = () => {
    const profile = localStorage.getItem('profile');
    if (!profile) return null;
    return normalizeProfile(JSON.parse(profile));
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const isLoggedIn = () => {
    return !!localStorage.getItem('token');
};

export default { login, register, getRegistrations, approveRegistration, rejectRegistration, getAllProfiles, deleteProfile, updateProfile, logout, getProfile, getToken, isLoggedIn };
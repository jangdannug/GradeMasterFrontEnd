import api from './api';

export const getBaseSubjects = async () => {
    try {
        const response = await api.get('/subjects/templates');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch base subjects';
    }
};

export const createBaseSubject = async (data) => {
    try {
        const response = await api.post('/subjects/templates', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to create base subject';
    }
};

export const updateBaseSubject = async (id, data) => {
    try {
        const response = await api.put(`/subjects/templates/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update base subject';
    }
};

export const deleteBaseSubject = async (id) => {
    try {
        const response = await api.delete(`/subjects/templates/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to delete base subject';
    }
};

export const getSubjects = async () => {
    try {
        const response = await api.get('/subjects');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch subjects';
    }
};

export const updateSubject = async (id, data) => {
    try {
        const response = await api.put(`/subjects/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update subject';
    }
};

export const createSubject = async (data) => {
    try {
        const response = await api.post('/subjects', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to create subject';
    }
};

// Assuming updateSubject and deleteSubject are handled by the existing update/delete methods in the hook

export default { getBaseSubjects, createBaseSubject, updateBaseSubject, deleteBaseSubject, getSubjects, createSubject, updateSubject };
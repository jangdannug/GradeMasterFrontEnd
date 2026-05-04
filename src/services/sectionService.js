import api from './api';

export const getSections = async () => {
    try {
        const response = await api.get('/sections');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch sections';
    }
};

export const createSection = async (data) => {
    try {
        const response = await api.post('/sections', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to create section';
    }
};

export const updateSection = async (id, data) => {
    try {
        const response = await api.put(`/sections/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update section';
    }
};

export const deleteSection = async (id) => {
    try {
        const response = await api.delete(`/sections/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to delete section';
    }
};


export const assignAdviser = async (sectionId, adviserData) => {
    try {
        // The backend expects { adviserId: "uuid" }
        const response = await api.put(`/sections/${sectionId}/assign-adviser`, adviserData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to assign adviser';
    }
};

export default { getSections, createSection, updateSection, deleteSection, assignAdviser };
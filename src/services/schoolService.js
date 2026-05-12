import api from './api';

export const getSchools = async () => {
    try {
        const response = await api.get('schools');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch schools';
    }
};

export const getSchoolById = async (id) => {
    try {
        const response = await api.get(`schools/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch school details';
    }
};

export const createSchool = async (schoolData) => {
    try {
        const response = await api.post('schools', schoolData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to create school';
    }
};

export const updateSchool = async (id, schoolData) => {
    try {
        const response = await api.put(`schools/${id}`, schoolData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update school';
    }
};

export const deleteSchool = async (id) => {
    try {
        await api.delete(`schools/${id}`);
    } catch (error) {
        throw error.response?.data?.message || 'Failed to delete school';
    }
};

export default { getSchools, getSchoolById, createSchool, updateSchool, deleteSchool };
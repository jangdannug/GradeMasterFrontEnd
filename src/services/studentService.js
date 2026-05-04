import api from './api';

export const getStudents = async (filters = {}) => {
    try {
        const response = await api.get('/students', { params: filters });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch students';
    }
};

export const getStudentById = async (id) => {
    try {
        const response = await api.get(`/students/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch student';
    }
};

export const createStudent = async (data) => {
    try {
        const response = await api.post('/students', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to create student';
    }
};

export const bulkUploadStudents = async (file, schoolYear, sectionId) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/students/bulk', formData, {
            params: { schoolYear, sectionId },
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Bulk upload failed';
    }
};

export const updateStudent = async (id, data) => {
    try {
        const response = await api.put(`/students/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update student';
    }
};

export const deleteStudent = async (id) => {
    try {
        const response = await api.delete(`/students/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to delete student';
    }
};

export default { getStudents, getStudentById, createStudent, bulkUploadStudents, updateStudent, deleteStudent };
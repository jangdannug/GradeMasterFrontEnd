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
        const response = await api.put(`/students/${String(id)}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update student';
    }
};

export const deleteStudent = async (id) => {
    try {
        const response = await api.delete(`/students/${String(id)}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to delete student';
    }
};

export const assignStudentToSection = async (studentId, sectionId) => {
    try {
        // Assuming a PATCH or PUT endpoint to update a student's section
        const response = await api.put(`/students/${String(studentId)}/assign-section`, { sectionId: String(sectionId) });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to assign student to section';
    }
};

export default { getStudents, getStudentById, createStudent, bulkUploadStudents, updateStudent, deleteStudent, assignStudentToSection };
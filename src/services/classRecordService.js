import api from './api';

export const getClassRecords = async (filters = {}) => {
    try {
        const response = await api.get('/classrecord', { params: filters });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch class records';
    }
};

export const getClassRecordById = async (id) => {
    try {
        const response = await api.get(`/classrecord/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch class record';
    }
};

export const submitClassRecord = async (data) => {
    try {
        const response = await api.post('/classrecord/submit', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Submission failed';
    }
};

export const requestEditClassRecord = async (recordId, teacherId, teacherName, reason) => {
    try {
        const response = await api.post(`/classrecord/${recordId}/request-edit`, { teacherId, teacherName, reason });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to request edit';
    }
};

export const approveEditRequest = async (recordId, adviserId, adviserName, reason) => {
    try {
        const response = await api.put(`/classrecord/${recordId}/approve-edit`, { adviserId, adviserName, reason });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to approve edit request';
    }
};

export const rejectEditRequest = async (recordId, adviserId, adviserName, reason) => {
    try {
        const response = await api.put(`/classrecord/${recordId}/reject-edit`, { adviserId, adviserName, reason });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to reject edit request';
    }
};

export const verifyClassRecord = async (id, isVerified, reason = "") => {
    try {
        const response = await api.put(`/classrecord/${id}/verify`, { isVerified, reason });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Verification failed';
    }
};

export const lockClassRecord = async (id, isLocked) => {
    try {
        const response = await api.put(`/classrecord/${id}/lock`, { isLocked });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update lock status';
    }
};

export const getClassRecordLogs = async (id) => {
    try {
        const response = await api.get(`/classrecord/${id}/logs`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch logs';
    }
};

export const calculateGrades = async (gradesJson, categoriesJson) => {
    try {
        const response = await api.post('/classrecord/calculate', { gradesJson, categoriesJson });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Calculation failed';
    }
};

export default { getClassRecords, getClassRecordById, submitClassRecord, requestEditClassRecord, approveEditRequest, rejectEditRequest, verifyClassRecord, lockClassRecord, getClassRecordLogs, calculateGrades };
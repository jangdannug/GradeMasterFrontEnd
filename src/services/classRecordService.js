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
        if (error.response?.status === 404) return null;
        throw error.response?.data?.message || 'Failed to fetch class record';
    }
};

export const getClassRecordByCompositeKey = async ({ sectionId, subjectId, quarter }) => {
    try {
        const response = await api.get('/classrecord', { // Backend expects int? for these
            params: { sectionId: Number(sectionId), subjectId: Number(subjectId), quarter: Number(quarter) }
        });
        const records = response.data;
        return Array.isArray(records) && records.length > 0 ? records[0] : null;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch class record';
    }
};

// ✅ Draft = just fetch existing record (no separate draft endpoint)
export const saveClassRecordDraft = async (recordId, data) => { // recordId is the composite key string
    try {
        const response = await api.put(`/classrecord/${recordId}/draft`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to save draft';
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

// ✅ Request edit = log action via verify (unlock) since no /request-edit endpoint
export const requestEditClassRecord = async (recordId, teacherId, teacherName, reason) => {
    try {
        // Unlock the record so the teacher can edit
        const response = await api.put(`/classrecord/${recordId}/lock`, { isLocked: false });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to request edit';
    }
};

// ✅ Approve edit = unlock record
export const approveEditRequest = async (recordId, adviserId, adviserName, reason) => {
    try {
        const response = await api.put(`/classrecord/${recordId}/lock`, { isLocked: false });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to approve edit request';
    }
};

// ✅ Reject edit = keep record locked
export const rejectEditRequest = async (recordId, adviserId, adviserName, reason) => {
    try {
        const response = await api.put(`/classrecord/${recordId}/lock`, { isLocked: true });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to reject edit request';
    }
};

export const verifyClassRecord = async (id, isVerified, reason = '') => {
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

export default {
    getClassRecords,
    getClassRecordById,
    getClassRecordByCompositeKey,
    saveClassRecordDraft,
    submitClassRecord,
    requestEditClassRecord,
    approveEditRequest,
    rejectEditRequest,
    verifyClassRecord,
    lockClassRecord,
    getClassRecordLogs,
    calculateGrades
};
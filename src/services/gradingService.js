import api from './api';

export const calculateGradeResult = async (gradeData) => {
    try {
        const response = await api.post('/grading/calculate', gradeData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to calculate grade';
    }
};

export const calculateBatchGrades = async (batchData) => {
    try {
        const response = await api.post('/grading/calculate-batch', batchData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to calculate grades';
    }
};

export default { calculateGradeResult, calculateBatchGrades };
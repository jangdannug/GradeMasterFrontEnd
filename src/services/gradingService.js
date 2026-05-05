import api from './api';

export const calculateGradeResult = async (gradeData) => {
    try {
        // UPDATED: Path matches ClassRecordController [HttpPost("calculate")]
        const response = await api.post('/classrecord/calculate', gradeData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to calculate grade';
    }
};

export const calculateBatchGrades = async (batchData) => {
    try {
        // batchData is expected to be an array of objects, where each object
        // contains the necessary data for a single CalculateRequest.
        // We ensure 'grades' and 'categories' are stringified JSON.
        // The backend expects a List<CalculateRequest>, so we map the frontend
        // data to match that structure.
        const payload = batchData.map(item => ({
            StudentId: String(item.studentId),
            GradesJson: typeof item.grades === 'string' ? item.grades : JSON.stringify(item.grades || {}),
            CategoriesJson: typeof item.categories === 'string' ? item.categories : JSON.stringify(item.categories || [])
        }));
        const response = await api.post('/classrecord/calculate-batch', payload); // Call the new batch endpoint
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to calculate grades';
    }
};

export default { calculateGradeResult, calculateBatchGrades };
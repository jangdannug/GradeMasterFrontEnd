import api from './api';

export const getTransmutationTable = async () => {
    try {
        const response = await api.get('/standards/transmutation');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch transmutation table';
    }
};

export const updateTransmutationTable = async (data) => {
    try {
        // Assuming the backend has a PUT endpoint to update the entire table or individual entries
        const response = await api.put('/standards/transmutation', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update transmutation table';
    }
};

export const getDescriptors = async () => {
    try {
        const response = await api.get('/standards/descriptors');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch descriptors';
    }
};

export const updateDescriptors = async (data) => {
    try {
        // Assuming the backend has a PUT endpoint to update the entire list of descriptors
        const response = await api.put('/standards/descriptors', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update descriptors';
    }
};

export default { getTransmutationTable, updateTransmutationTable, getDescriptors, updateDescriptors };
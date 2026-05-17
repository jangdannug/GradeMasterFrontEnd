import api from './api';

export const getTransmutationTable = async () => {
    try {
        const response = await api.get('/standards/transmutation');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch transmutation table';
    }
};

// NEW: Add Transmutation Entry
export const addTransmutation = async (data) => {
    try {
        const response = await api.post('/standards/transmutation', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to add transmutation entry';
    }
};

export const updateTransmutationTable = async (data) => {
    try {
        // This endpoint is for bulk update/replace. If backend supports individual PUT, use that.
        // For now, we'll assume this is a bulk update or it will be handled by individual calls.
        // If your backend only supports individual PUT, this function will need to be refactored
        // in useGradingStandards to make multiple calls.
        const response = await api.put('/standards/transmutation/bulk', data); // Assuming a bulk PUT endpoint
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update transmutation table';
    }
};

// NEW: Update single Transmutation Entry
export const updateTransmutation = async (id, data) => {
    try {
        const response = await api.put(`/standards/transmutation/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update transmutation entry';
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
        const response = await api.post('/standards/saveDescriptors', data);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update descriptors';
    }
};

export const deleteDescriptor = async (id) => {
    try {
        // Ensure this matches your C# [HttpDelete("deleteDescriptors/{id}")]
        const response = await api.delete(`/standards/deleteDescriptors/${id}`); 
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to delete descriptor';
    }
};

// NEW: Delete Transmutation Entry
export const deleteTransmutation = async (id) => {
    try {
        const response = await api.delete(`/standards/transmutation/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to delete transmutation entry';
    }
};

export default { getTransmutationTable, addTransmutation, updateTransmutation, updateTransmutationTable, deleteTransmutation, getDescriptors, updateDescriptors, deleteDescriptor };
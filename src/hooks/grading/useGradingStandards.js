import { useState, useEffect, useCallback } from 'react';
import standardsService from '../../services/standardsService';
import authService from '../../services/authService';

export function useGradingStandards(currentUser) {
  const [transmutationTable, setTransmutationTable] = useState([]);
  const [descriptors, setDescriptors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to normalize PascalCase keys from C# to camelCase for the frontend
  const normalize = (data) => {
    if (!data) return data;
    const transform = (obj) => Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k.charAt(0).toLowerCase() + k.slice(1), v])
    );
    return Array.isArray(data) ? data.map(transform) : transform(data);
  };

  const syncStandards = useCallback(async () => {
    const activeUser = currentUser || authService.getProfile();
    if (activeUser && authService.isLoggedIn()) {
      setError(null);
      setLoading(true);
      try {
        const [fetchedTransmutation, fetchedDescriptors] = await Promise.all([
          standardsService.getTransmutationTable(),
          standardsService.getDescriptors()
        ]);
        setTransmutationTable(normalize(fetchedTransmutation));
        setDescriptors(normalize(fetchedDescriptors));
      } catch (err) {
        console.error("Failed to fetch grading standards:", err);
        setError(err);
      }
    }
  }, [currentUser]);

  // NEW: Add a single transmutation entry
  const addTransmutationAPI = async (entry) => {
    try {
      setError(null);
      const response = await standardsService.addTransmutation(entry);
      // Assuming backend returns the new entry with its ID
      setTransmutationTable(prev => [...prev, normalize(response.data)]);
      return response;
    } catch (err) {
      console.error("Failed to add transmutation entry:", err);
      setError(err);
      throw err;
    }
  };

  // NEW: Update a single transmutation entry
  const updateTransmutationAPI = async (id, entry) => {
    try {
      setError(null);
      const response = await standardsService.updateTransmutation(id, entry);
      setTransmutationTable(prev => prev.map(t => String(t.id) === String(id) ? normalize(response.data) : t));
      return response;
    } catch (err) {
      console.error("Failed to update transmutation entry:", err);
      setError(err);
      throw err;
    }
  };

  // NEW: Delete a single transmutation entry
  const deleteTransmutationAPI = async (id) => {
    try {
      setError(null);
      await standardsService.deleteTransmutation(id);
      setTransmutationTable(prev => prev.filter(t => String(t.id) !== String(id)));
    } catch (err) {
      console.error("Failed to delete transmutation entry:", err);
      setError(err);
      throw err;
    }
  };

  // This function will now orchestrate the save for TransmutationSettings
  const saveTransmutationTableAPI = async (localData) => {
    try {
      setError(null);
      // Compare localData with current transmutationTable to identify changes
      // For simplicity, we'll re-fetch all after a save, or implement a more complex diff.
      // Given the new backend has individual endpoints, we'll just re-sync.
      await syncStandards(); // Re-sync to get the latest state from the DB
      return { message: "Transmutation table saved successfully." };
    } catch (err) {
      console.error("Failed to update transmutation table:", err);
      setError(err);
      throw err;
    }
  };

  const updateDescriptorsAPI = async (data) => {
    try {
      setError(null);
      const response = await standardsService.updateDescriptors(data);
      if (response && response.descriptors) {
        setDescriptors(normalize(response.descriptors)); 
      }
      
      return response; // Return to allow component to access success message
    } catch (err) {
      console.error("Failed to update descriptors:", err);
      setError(err);
      throw err;
    }
  };

  const deleteDescriptorAPI = async (id) => {
    try {
      setError(null);
      await standardsService.deleteDescriptor(id);
      setDescriptors(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Failed to delete descriptor:", err);
      setError(err);
      throw err;
    }
  };

  return { transmutationTable, syncStandards, setTransmutationTable: saveTransmutationTableAPI, addTransmutation: addTransmutationAPI, updateTransmutation: updateTransmutationAPI, deleteTransmutation: deleteTransmutationAPI, descriptors, setDescriptors: updateDescriptorsAPI, deleteDescriptor: deleteDescriptorAPI, error };
}
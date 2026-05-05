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

  const updateTransmutationTableAPI = async (data) => {
    try {
      setError(null);
      const updated = await standardsService.updateTransmutationTable(data);
      setTransmutationTable(normalize(updated));
    } catch (err) {
      console.error("Failed to update transmutation table:", err);
      setError(err);
      throw err;
    }
  };

  const updateDescriptorsAPI = async (data) => {
    try {
      setError(null);
      const updated = await standardsService.updateDescriptors(data);
      setDescriptors(normalize(updated));
    } catch (err) {
      console.error("Failed to update descriptors:", err);
      setError(err);
      throw err;
    }
  };

  return { transmutationTable, syncStandards, setTransmutationTable: updateTransmutationTableAPI, descriptors, setDescriptors: updateDescriptorsAPI, error };
}
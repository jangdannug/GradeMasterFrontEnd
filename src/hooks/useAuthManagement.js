import { useState, useEffect } from 'react';
import authService from '../services/authService';

export function useAuthManagement(currentUser) {
  const [users, setUsers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState(null);

  // Fetch profiles and registrations if user is admin to sync with backend
  const syncAuthData = async () => {
    // Use currentUser prop or get from service
    const activeUser = currentUser || authService.getProfile();
    
    if (activeUser?.role === 'admin' && authService.isLoggedIn()) {
      setError(null); // Clear previous errors
      try {
        const [allUsers, allRegs] = await Promise.all([
          authService.getAllProfiles(),
          authService.getRegistrations()
        ]);

        // Helper to normalize PascalCase keys from C# to camelCase for the frontend
        const normalize = (data) => Array.isArray(data) 
          ? data.map(item => Object.fromEntries(
              Object.entries(item).map(([k, v]) => [k.charAt(0).toLowerCase() + k.slice(1), v])
            ))
          : data;

        setUsers(normalize(allUsers));
        setRegistrations(normalize(allRegs));
      } catch (err) {
        console.error("Auth management sync failed:", err);
        setError(err);
      }
    }
  };

  useEffect(() => {
    localStorage.removeItem('gradeMaster_registrations');
  }, []);

  const rejectRegistration = async (regId, reason = "") => {
    try {
      await authService.rejectRegistration(regId, reason);
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'rejected' } : r));
    } catch (error) {
      console.error("Failed to reject registration:", error);
      throw error;
    }
  };

  const updateUser = (id, data) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  };

  return { users, setUsers, registrations, setRegistrations, syncAuthData, rejectRegistration, updateUser, error };
}
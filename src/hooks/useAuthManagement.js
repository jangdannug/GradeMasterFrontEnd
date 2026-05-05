import { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export function useAuthManagement(currentUser) {
  const [users, setUsers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState(null);

  // Fetch profiles and registrations if user is admin to sync with backend
  const syncAuthData = useCallback(async () => {
    // Use currentUser prop or get from service
    const activeUser = currentUser || authService.getProfile();
    
    if (activeUser && (activeUser.role === 'admin' || activeUser.role === 'adviser') && authService.isLoggedIn()) {
      setError(null); // Clear previous errors
      try {
        // Fetch user profiles (needed by both Admin and Adviser)
        const allUsers = await authService.getAllProfiles();

        const normalizeUser = (p) => ({
          ...p,
          id: p.id || p.Id,
          name: p.name || p.Name,
          username: p.username || p.Username,
          role: p.role || p.Role,
          assignedSectionId: p.assignedSectionId || p.AssignedSectionId || p.assigned_section_id,
          assignedSubjectIds: p.assignedSubjectIds || p.AssignedSubjectIds || p.assigned_subject_ids || []
        });

        setUsers(Array.isArray(allUsers) ? allUsers.map(normalizeUser) : []);

        // Only fetch pending registrations if Admin
        if (activeUser.role === 'admin') {
          try {
            const allRegs = await authService.getRegistrations();
            // Simple normalization for registrations is usually fine as they don't have circular refs
            setRegistrations(Array.isArray(allRegs) ? allRegs.map(r => ({ ...r, id: r.id || r.Id })) : []);
          } catch (regErr) {
            console.warn("Failed to fetch registrations (likely restricted):", regErr);
          }
        }
      } catch (err) {
        console.error("Auth management sync failed:", err);
        setError(err);
      }
    }
  }, [currentUser]);

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
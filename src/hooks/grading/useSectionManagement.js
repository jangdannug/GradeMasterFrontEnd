import { useState, useEffect } from 'react';
import authService from '../../services/authService';
import sectionService from '../../services/sectionService';

export function useSectionManagement(users, setUsers, registrations, setRegistrations, currentUser) {
  const [sections, setSections] = useState([]);

  // Helper to normalize PascalCase keys from C# to camelCase for the frontend
  const normalize = (data) => {
    if (!data) return data;
    const transform = (obj) => Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k.charAt(0).toLowerCase() + k.slice(1), v])
    );
    return Array.isArray(data) ? data.map(transform) : transform(data);
  };

  // Fetch sections from API on mount or when user changes
  useEffect(() => {
    const syncSections = async () => {
      const activeUser = currentUser || authService.getProfile();
      if (activeUser && authService.isLoggedIn()) {
        try {
          const data = await sectionService.getSections();
          setSections(normalize(data));
        } catch (error) {
          console.error("Failed to sync sections from API:", error);
        }
      }
    };
    syncSections();
  }, [currentUser]);

  const createSection = async (data) => {
    try {
      const newSection = await sectionService.createSection(data);
      setSections(prev => [...prev, normalize(newSection)]);
    } catch (error) {
      console.error("Create section failed:", error);
      throw error;
    }
  };

  const updateSection = async (id, data) => {
    try {
      const updated = await sectionService.updateSection(id, data);
      setSections(prev => prev.map(s => s.id === id ? normalize(updated) : s));
    } catch (error) {
      console.error("Update section failed:", error);
      throw error;
    }
  };

  const deleteSection = async (id) => {
    try {
      await sectionService.deleteSection(id);
      setSections(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error("Delete section failed:", error);
      throw error;
    }
  };

  const assignAdviser = async (sectionId, teacherId) => {
    try {
      const updatedSection = await sectionService.assignAdviser(sectionId, { adviserId: teacherId });
      setSections(prev => prev.map(sec => 
        sec.id === sectionId ? normalize(updatedSection) : sec
      ));

      setUsers(prev => prev.map(u => {
        if (u.id === teacherId) return { ...u, role: 'adviser', assignedSectionId: sectionId };
        if (u.assignedSectionId === sectionId) return { ...u, role: 'teacher', assignedSectionId: null };
        return u;
      }));
    } catch (error) {
      console.error("Assign adviser failed:", error);
      throw error;
    }
  };

  const approveRegistration = async (regId, role, sectionId, subjectIds = []) => {
    try {
      // UPDATED: Use backend API for approval
      const approvedProfile = await authService.approveRegistration(regId, { 
        role, 
        sectionId: sectionId || null, // FIX: Convert empty string to null for .NET nullable types
        subjectIds 
      });

      // Update local state with the actual profile created by backend
      setUsers(prev => [...prev, approvedProfile]);
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'approved' } : r));
      
      // Sync section adviser if applicable
      if (role === 'adviser' && sectionId) {
        setSections(prev => prev.map(sec => 
          sec.id === sectionId ? { ...sec, adviserId: approvedProfile.id } : sec
        ));
      }
    } catch (error) {
      console.error("Failed to approve registration:", error);
      throw error;
    }
  };

  return { sections: sections || [], setSections, createSection, updateSection, deleteSection, assignAdviser, approveRegistration };
}
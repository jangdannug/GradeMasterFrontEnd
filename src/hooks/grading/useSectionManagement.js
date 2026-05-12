import { useState, useCallback, useEffect } from 'react';
import authService from '../../services/authService';
import sectionService from '../../services/sectionService';

// Helper to normalize Section properties (bridging database naming to frontend)
const normalizeSection = (item) => ({
  ...item,
  id: item.id || item.Id,
  name: item.name || item.Name,
  gradeLevel: item.gradeLevel || item.GradeLevel || item.grade_level,
  adviserId: item.adviserId || item.AdviserId || item.adviser_id,
  schoolYear: item.schoolYear || item.SchoolYear || item.school_year,
  region: item.region || item.Region,
  division: item.division || item.Division,
  schoolId: item.schoolId || item.SchoolId || item.school_id,
  schoolName: item.schoolName || item.SchoolName || item.school_name
});

export function useSectionManagement(users, setUsers, registrations, setRegistrations, currentUser) {
  const [sections, setSections] = useState([]);
  const [error, setError] = useState(null);

  const syncSections = useCallback(async () => {
    const activeUser = currentUser || authService.getProfile();
    if (activeUser && authService.isLoggedIn()) {
      setError(null);
      try {
        const data = await sectionService.getSections();
        setSections(Array.isArray(data) ? data.map(normalizeSection) : []);
      } catch (err) {
        console.error("Failed to sync sections from API:", err);
        setError(err);
      }
    }
  }, [currentUser]);

  const createSection = async (data) => {
    try {
      const newSection = await sectionService.createSection(data);
      setSections(prev => [...prev, normalizeSection(newSection)]);
    } catch (error) {
      console.error("Create section failed:", error);
      throw error;
    }
  };

  const updateSection = async (id, data) => {
    try {
      const updated = await sectionService.updateSection(id, data);
      setSections(prev => prev.map(s => s.id === id ? normalizeSection(updated) : s));
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
        sec.id === sectionId ? normalizeSection(updatedSection) : sec
      ));

      setUsers(prev => prev.map(u => {
        if (u.id === teacherId) return { ...u, role: 'adviser', assignedSectionId: sectionId };
        if (u.assignedSectionId === sectionId) return { ...u, role: 'teacher', assignedSectionId: null };
        return u;
      }));
    } catch (error) {
      console.error("Assign adviser failed:", error);
      setError(error);
      throw error;
    }
  };

  const approveRegistration = async (regId, role, sectionId, subjectIds = []) => {
    try {
      // UPDATED: Use backend API for approval
      setError(null);
      const approvedProfile = await authService.approveRegistration(regId, { 
        role, 
        sectionId: sectionId || null, // FIX: Convert empty string to null for .NET nullable types
        subjectIds 
      });

      // Update local state with the actual profile created by backend
      setUsers(prev => [...prev, normalizeSection(approvedProfile)]);
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'approved' } : r));
      
      // Sync section adviser if applicable
      if (role === 'adviser' && sectionId) {
        setSections(prev => prev.map(sec => 
          sec.id === sectionId ? { ...sec, adviserId: approvedProfile.id } : sec
        ));
      }
    } catch (error) {
      console.error("Failed to approve registration:", error);
      setError(error);
      throw error;
    }
  };

  return { sections: sections || [], setSections, syncSections, createSection, updateSection, deleteSection, assignAdviser, approveRegistration, error };
}
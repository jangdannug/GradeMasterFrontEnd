import { useState, useEffect } from 'react';
import authService from '../../services/authService';
import subjectService from '../../services/subjectService';

export function useSubjectManagement(users, setUsers) {
  const [subjects, setSubjects] = useState([]);
  const [baseSubjects, setBaseSubjects] = useState([]);
  const [baseSubjectsLoading, setBaseSubjectsLoading] = useState(false);
  const [baseSubjectsError, setBaseSubjectsError] = useState(null);

  useEffect(() => {
    localStorage.removeItem('gradeMaster_subjects');
    localStorage.removeItem('gradeMaster_baseSubjects');
  }, []);

  // Fetch base subjects from API on mount only when authenticated
  useEffect(() => {
    const fetchBaseSubjects = async () => {
      setBaseSubjectsLoading(true);
      setBaseSubjectsError(null);
      try {
        const data = await subjectService.getBaseSubjects();
        // Normalize PascalCase from backend to camelCase for frontend
        const normalizedData = data.map(item => ({
          id: item.Id,
          name: item.Name,
          code: item.Code,
          gradeLevel: item.GradeLevel,
          categories: item.CategoriesJson ? JSON.parse(item.CategoriesJson) : []
        }));
        setBaseSubjects(normalizedData);
      } catch (error) {
        console.error('Failed to fetch base subjects:', error);
        setBaseSubjectsError(error.message);
      } finally {
        setBaseSubjectsLoading(false);
      }
    };

    if (authService.isLoggedIn()) {
      fetchBaseSubjects();
    }
  }, []);

  // Automatic synchronization: When any template changes, update all corresponding class records
  useEffect(() => {
    if (!baseSubjects || baseSubjects.length === 0) return;

    setSubjects(prevSubjects => {
      let hasStructuralChanges = false;
      const syncedSubjects = prevSubjects.map(sub => {
        // Match template by code and grade level
        const template = baseSubjects.find(b => b.code === sub.code && b.gradeLevel === sub.gradeLevel);
        if (!template) return sub;

        // Compare structure (categories and name) to avoid unnecessary re-renders
        const templateCatsJson = JSON.stringify(template.categories);
        const subCatsJson = JSON.stringify(sub.categories);

        if (templateCatsJson !== subCatsJson || sub.name !== template.name) {
          hasStructuralChanges = true;
          return { ...sub, name: template.name, categories: JSON.parse(templateCatsJson) };
        }
        return sub;
      });

      return hasStructuralChanges ? syncedSubjects : prevSubjects;
    });
  }, [baseSubjects]);

  const syncInstancesWithTemplate = (updatedBase) => {
    setSubjects(prev => prev.map(sub => {
      if (sub.code === updatedBase.code && sub.gradeLevel === updatedBase.gradeLevel) {
        return { ...sub, categories: JSON.parse(JSON.stringify(updatedBase.categories)), name: updatedBase.name };
      }
      return sub;
    }));
  };

  const createBaseSubject = async (data) => {
    try {
      const response = await subjectService.createBaseSubject(data);
      // Normalize the response from PascalCase to camelCase
      const normalizedBaseSubject = {
        id: response.Id,
        name: response.Name,
        code: response.Code,
        gradeLevel: response.GradeLevel,
        categories: response.CategoriesJson ? JSON.parse(response.CategoriesJson) : []
      };
      setBaseSubjects(prev => [...prev, normalizedBaseSubject]);
      return normalizedBaseSubject;
    } catch (error) {
      console.error('Failed to create base subject:', error);
      throw error;
    }
  };

  const updateBaseSubject = async (id, data) => {
    try {
      const response = await subjectService.updateBaseSubject(id, data);
      // Normalize the response from PascalCase to camelCase
      const normalizedBaseSubject = {
        id: response.template?.Id || response.Id,
        name: response.template?.Name || response.Name,
        code: response.template?.Code || response.Code,
        gradeLevel: response.template?.GradeLevel || response.GradeLevel,
        categories: response.template?.CategoriesJson ? JSON.parse(response.template.CategoriesJson) : 
                   response.CategoriesJson ? JSON.parse(response.CategoriesJson) : []
      };
      setBaseSubjects(prev => prev.map(b => {
        if (b.id === id) {
          const updated = { ...b, ...normalizedBaseSubject };
          syncInstancesWithTemplate(updated);
          return updated;
        }
        return b;
      }));
      return normalizedBaseSubject;
    } catch (error) {
      console.error('Failed to update base subject:', error);
      throw error;
    }
  };

  const deleteBaseSubject = async (id) => {
    try {
      await subjectService.deleteBaseSubject(id);
      setBaseSubjects(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Failed to delete base subject:', error);
      throw error;
    }
  };

  const addSubject = (data) => {
    const base = baseSubjects.find(b => b.id === data.baseSubjectId);
    if (!base) return;

    // Prevent adding duplicate subject to the same section
    const existingSubject = subjects.find(s =>
      s.code === base.code &&
      s.gradeLevel === base.gradeLevel &&
      s.sectionId === data.sectionId
    );

    if (existingSubject) {
      console.warn(`Subject ${base.name} (Code: ${base.code}) already exists in section ${data.sectionId}.`);
      return; // Do not add the subject if a duplicate exists
    }

    const newSub = {
      ...data,
      id: `sub-${Date.now()}`,
      name: base.name,
      code: base.code,
      gradeLevel: base.gradeLevel,
      categories: JSON.parse(JSON.stringify(base.categories || []))
    };

    setSubjects(prev => [...prev, newSub]);

    if (data.teacherId) {
      setUsers(prev => prev.map(user => {
        if (user.id !== data.teacherId) return user;
        return { ...user, assignedSubjectIds: [...(user.assignedSubjectIds || []), newSub.id] };
      }));
    }
  };

  const deleteSubject = (id) => {
    const sub = subjects.find(s => s.id === id);
    setSubjects(prev => prev.filter(s => s.id !== id));

    if (sub?.teacherId) {
      setUsers(prev => prev.map(u => u.id === sub.teacherId 
        ? { ...u, assignedSubjectIds: (u.assignedSubjectIds || []).filter(sid => sid !== id) } 
        : u));
    }
  };

  const updateSubject = (id, data) => {
    const old = subjects.find(s => s.id === id);
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));

    if (data.teacherId) {
      setUsers(prev => prev.map(u => {
        let sids = new Set(u.assignedSubjectIds || []);
        if (u.id === data.teacherId) sids.add(id);
        else if (u.id === old?.teacherId) sids.delete(id);
        return { ...u, assignedSubjectIds: Array.from(sids) };
      }));
    }
  };

  return { 
    subjects, 
    setSubjects, 
    baseSubjects, 
    setBaseSubjects, 
    baseSubjectsLoading, 
    baseSubjectsError,
    createBaseSubject, 
    updateBaseSubject, 
    deleteBaseSubject, 
    addSubject, 
    deleteSubject, 
    updateSubject 
  };
}
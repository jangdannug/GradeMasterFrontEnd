import { useState, useEffect } from 'react';
import { DEFAULT_SUBJECTS } from '../../mockData';

export function useSubjectManagement(users, setUsers) {
  const [subjects, setSubjects] = useState(() => JSON.parse(localStorage.getItem('gradeMaster_subjects')) || DEFAULT_SUBJECTS);
  const [baseSubjects, setBaseSubjects] = useState(() => JSON.parse(localStorage.getItem('gradeMaster_baseSubjects')) || []);

  useEffect(() => localStorage.setItem('gradeMaster_subjects', JSON.stringify(subjects)), [subjects]);
  useEffect(() => localStorage.setItem('gradeMaster_baseSubjects', JSON.stringify(baseSubjects)), [baseSubjects]);

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

  const createBaseSubject = (data) => {
    setBaseSubjects(prev => [...prev, { ...data, id: `base-${Date.now()}`, categories: [] }]);
  };

  const updateBaseSubject = (id, data) => {
    setBaseSubjects(prev => prev.map(b => {
      if (b.id === id) {
        const updated = { ...b, ...data };
        syncInstancesWithTemplate(updated);
        return updated;
      }
      return b;
    }));
  };

  const deleteBaseSubject = (id) => setBaseSubjects(prev => prev.filter(b => b.id !== id));

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

  return { subjects, setSubjects, baseSubjects, setBaseSubjects, createBaseSubject, updateBaseSubject, deleteBaseSubject, addSubject, deleteSubject, updateSubject };
}
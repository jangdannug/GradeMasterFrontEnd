import { useState, useEffect } from 'react';
import subjectService from '../services/subjectService';

export function useSubjectManagement(users, setUsers) {
  const [subjects, setSubjects] = useState([]);
  const [baseSubjects, setBaseSubjects] = useState([]);

  const syncInstancesWithTemplate = (updatedBase) => {
    setSubjects(prev => prev.map(sub => {
      if (sub.code === updatedBase.code && sub.gradeLevel === updatedBase.gradeLevel) {
        return { ...sub, categories: [...updatedBase.categories], name: updatedBase.name };
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

    const newSub = {
      ...data,
      id: `sub-${Date.now()}`,
      name: base.name,
      code: base.code,
      gradeLevel: base.gradeLevel,
      categories: [...base.categories]
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

  return { subjects, setSubjects, baseSubjects, createBaseSubject, updateBaseSubject, deleteBaseSubject, addSubject, deleteSubject, updateSubject };
}
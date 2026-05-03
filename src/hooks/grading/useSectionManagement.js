import { useState, useEffect } from 'react';
import { INITIAL_SECTIONS } from '../../mockData';

export function useSectionManagement(users, setUsers, registrations, setRegistrations) {
  const [sections, setSections] = useState(() => 
    JSON.parse(localStorage.getItem('gradeMaster_sections')) || INITIAL_SECTIONS
  );

  useEffect(() => {
    localStorage.setItem('gradeMaster_sections', JSON.stringify(sections));
  }, [sections]);

  const createSection = (data) => {
    setSections(prev => [...prev, { ...data, id: `sec-${Date.now()}`, adviserId: '' }]);
  };

  const updateSection = (id, data) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const deleteSection = (id) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const assignAdviser = (sectionId, teacherId) => {
    setSections(prev => prev.map(sec => 
      sec.id === sectionId ? { ...sec, adviserId: teacherId } : sec
    ));

    setUsers(prev => prev.map(u => {
      if (u.id === teacherId) return { ...u, role: 'adviser', assignedSectionId: sectionId };
      if (u.assignedSectionId === sectionId) return { ...u, role: 'teacher', assignedSectionId: undefined };
      return u;
    }));
  };

  const approveRegistration = (regId, role, sectionId) => {
    // Defensive check: ensure registrations is an array before calling find
    const regList = Array.isArray(registrations) ? registrations : [];
    const reg = regList.find(r => r.id === regId);
    if (!reg) return;

    // Ensure we don't carry over the registration status or ID directly into the user object
    const { id, status, createdAt, ...userData } = reg;
    
    const newUser = { id: `u-${Date.now()}`, ...userData, role, assignedSectionId: sectionId, assignedSubjectIds: [], status: 'active' };
    setUsers(prev => [...prev, newUser]);
    setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'approved' } : r));
    
    if (role === 'adviser' && sectionId) assignAdviser(sectionId, newUser.id);
  };

  return { sections: sections || [], setSections, createSection, updateSection, deleteSection, assignAdviser, approveRegistration };
}
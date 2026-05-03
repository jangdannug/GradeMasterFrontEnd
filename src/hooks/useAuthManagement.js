import { useState, useEffect } from 'react';
import { USERS } from '../mockData';

export function useAuthManagement() {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('gradeMaster_users');
    return saved ? JSON.parse(saved) : USERS;
  });

  const [registrations, setRegistrations] = useState(() => {
    const saved = localStorage.getItem('gradeMaster_registrations');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('gradeMaster_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('gradeMaster_registrations', JSON.stringify(registrations));
  }, [registrations]);

  const registerUser = (data) => {
    const newReg = { ...data, id: `reg-${Date.now()}`, status: 'pending', createdAt: new Date().toISOString() };
    setRegistrations(prev => [...prev, newReg]);
  };

  const rejectRegistration = (regId) => {
    setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'rejected' } : r));
  };

  const updateUser = (id, data) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  };

  return { users, setUsers, registrations, setRegistrations, registerUser, rejectRegistration, updateUser };
}
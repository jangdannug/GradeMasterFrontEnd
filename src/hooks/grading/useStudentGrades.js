import { useState, useEffect } from 'react';
import { INITIAL_STUDENTS } from '../../mockData';

export function useStudentGrades(subjects, setSubjects, setBaseSubjects) {
  const [students, setStudents] = useState(() => JSON.parse(localStorage.getItem('gradeMaster_students')) || INITIAL_STUDENTS);

  useEffect(() => localStorage.setItem('gradeMaster_students', JSON.stringify(students)), [students]);

  const updateGrade = (studentId, subjectId, categoryId, type, index, value, quarter) => {
    setStudents(prev => prev.map(student => {
      if (studentId !== 'HPS' && student.id !== studentId) return student;

      const grades = { ...(student.grades || {}) };
      const subGrades = { ...(grades[subjectId] || {}) };
      const quarterGrades = { ...(subGrades[quarter] || { categoryGrades: {} }) };
      const catGrades = { ...(quarterGrades.categoryGrades || {}) };
      const current = { ...(catGrades[categoryId] || {
        categoryId,
        scores: [],
        hps: [],
        columnNames: []
      }) };

      if (type === 'hps') {
        const nextHps = [...current.hps];
        nextHps[index] = value || 0;
        current.hps = nextHps;
      } else if (studentId !== 'HPS') {
        const nextScores = [...current.scores];
        nextScores[index] = { points: value };
        current.scores = nextScores;
      }

      catGrades[categoryId] = current;
      quarterGrades.categoryGrades = catGrades;
      subGrades[quarter] = quarterGrades;
      grades[subjectId] = subGrades;
      return { ...student, grades };
    }));
  };

  const updateCategoryTitle = (subjectId, categoryId, title) => {
    setBaseSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return { ...s, categories: s.categories.map(c => c.id === categoryId ? { ...c, name: title } : c) };
    }));
  };

  const updateCategoryWeight = (subjectId, categoryId, weight) => {
    setBaseSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return { ...s, categories: s.categories.map(c => c.id === categoryId ? { ...c, weight: weight / 100 } : c) };
    }));
  };

  const updateColumnName = (subjectId, categoryId, index, name) => {
    setBaseSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return { ...s, categories: s.categories.map(c => {
        if (c.id !== categoryId) return c;
        const names = [...(c.columnNames || [])];
        names[index] = name;
        return { ...c, columnNames: names };
      }) };
    }));
  };

  const addCategory = (subjectId) => {
    setBaseSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return { ...s, categories: [...s.categories, { id: `cat-${Date.now()}`, name: 'NEW', weight: 0.1, columnNames: ['1','2','3'] }] };
    }));
  };

  const removeCategory = (subjectId, categoryId) => {
    setBaseSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, categories: s.categories.filter(c => c.id !== categoryId) } : s));
  };

  const addColumnToCategory = (subjectId, categoryId) => {
    setBaseSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return { ...s, categories: s.categories.map(c => c.id === categoryId ? { ...c, columnNames: [...c.columnNames, (c.columnNames.length + 1).toString()] } : c) };
    }));
  };

  const removeColumnFromCategory = (subjectId, categoryId) => {
    setBaseSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return { ...s, categories: s.categories.map(c => (c.id === categoryId && c.columnNames.length > 2) ? { ...c, columnNames: c.columnNames.slice(0, -1) } : c) };
    }));
  };

  const resetSubjectTemplate = (id) => {
    setBaseSubjects(prev => prev.map(s => s.id === id ? { ...s, categories: [
      { id: `cat-ww-${Date.now()}`, name: 'WRITTEN WORKS', weight: 0.3, columnNames: ['1','2','3','4','5'] },
      { id: `cat-pt-${Date.now()}`, name: 'PERFORMANCE TASKS', weight: 0.5, columnNames: ['1','2','3','4','5'] },
      { id: `cat-qa-${Date.now()}`, name: 'QUARTERLY ASSESSMENT', weight: 0.2, columnNames: ['1'] },
    ] } : s));
  };

  // Function for enrolling a student to a specific section (used by AdvisoryDashboardView)
  const addStudentToSection = (name, gender, sectionId) => setStudents(prev => [...prev, { id: Date.now().toString(), name, gender, sectionId, grades: {} }]);
  const removeStudent = (id) => setStudents(prev => prev.filter(s => s.id !== id));

  // New function for overall student registration (not necessarily assigned to a section yet)
  const enrollStudentOverall = (lastName, firstName, middleName, gender, gradeLevel, schoolYear) => {
    const fullName = `${lastName.trim()}, ${firstName.trim()} ${middleName.trim()}`.toUpperCase().trim();
    const newStudent = {
      id: `std-${Date.now()}`,
      name: fullName,
      gender,
      gradeLevel,
      schoolYear,
      sectionId: null, // Initially unassigned
      grades: {}
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const assignStudentToSection = (studentId, sectionId) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, sectionId } : s));
  };

  const updateStudent = (studentId, data) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...data } : s));
  };

  return { 
    students, updateGrade, updateCategoryTitle, updateCategoryWeight, updateColumnName, addCategory, removeCategory, addColumnToCategory, removeColumnFromCategory, resetSubjectTemplate, 
    addStudentToSection, removeStudent, enrollStudentOverall, assignStudentToSection, updateStudent
  };
}
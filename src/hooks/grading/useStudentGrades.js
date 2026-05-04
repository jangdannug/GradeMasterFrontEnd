import { useState, useEffect } from 'react';
import studentService from '../../services/studentService';
import authService from '../../services/authService';

export function useStudentGrades(subjects, setSubjects, setBaseSubjects, currentUser) {
  const [students, setStudents] = useState([]);

  // Helper to normalize PascalCase keys from C# to camelCase for the frontend
  const normalize = (data) => {
    if (!data) return data;
    const transform = (obj) => Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k.charAt(0).toLowerCase() + k.slice(1), v])
    );
    return Array.isArray(data) ? data.map(transform) : transform(data);
  };

  useEffect(() => {
    const fetchStudents = async () => {
      const activeUser = currentUser || authService.getProfile();
      if (activeUser && authService.isLoggedIn()) {
        try {
          const data = await studentService.getStudents();
          setStudents(normalize(data));
        } catch (error) {
          console.error("Failed to fetch students:", error);
        }
      }
    };
    fetchStudents();
  }, [currentUser]);

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
    // This should ideally update the base subject template via API
    // and then trigger a sync for all instances.
    // For now, we'll update locally and assume a separate API call for base subjects.
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) { // Assuming subjectId here refers to baseSubjectId
        return { ...baseSub, categories: baseSub.categories.map(c => c.id === categoryId ? { ...c, name: title } : c) };
      }
      return baseSub;
    }));
    // TODO: Add API call to update base subject
  };

  const updateCategoryWeight = (subjectId, categoryId, weight) => {
    // This should ideally update the base subject template via API
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) { // Assuming subjectId here refers to baseSubjectId
        return { ...baseSub, categories: baseSub.categories.map(c => c.id === categoryId ? { ...c, weight: weight / 100 } : c) };
      }
      return baseSub;
    }));
    // TODO: Add API call to update base subject
  };

  const updateColumnName = (subjectId, categoryId, index, name) => {
    // This should ideally update the base subject template via API
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) { // Assuming subjectId here refers to baseSubjectId
        return { ...baseSub, categories: baseSub.categories.map(c => {
          if (c.id !== categoryId) return c;
          const names = [...(c.columnNames || [])];
          names[index] = name;
          return { ...c, columnNames: names };
        }) };
      }
      return baseSub;
    }));
    // TODO: Add API call to update base subject
  };

  const addCategory = (subjectId) => {
    // This should ideally update the base subject template via API
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) { // Assuming subjectId here refers to baseSubjectId
        return { ...baseSub, categories: [...baseSub.categories, { id: `cat-${Date.now()}`, name: 'NEW', weight: 0.1, columnNames: ['1','2','3'] }] };
      }
      return baseSub;
    }));
    // TODO: Add API call to update base subject
  };

  const removeCategory = (subjectId, categoryId) => {
    // This should ideally update the base subject template via API
    setBaseSubjects(prev => prev.map(baseSub => baseSub.id === subjectId ? { ...baseSub, categories: baseSub.categories.filter(c => c.id !== categoryId) } : baseSub));
    // TODO: Add API call to update base subject
  };

  const addColumnToCategory = (subjectId, categoryId) => {
    // This should ideally update the base subject template via API
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) { // Assuming subjectId here refers to baseSubjectId
        return { ...baseSub, categories: baseSub.categories.map(c => c.id === categoryId ? { ...c, columnNames: [...c.columnNames, (c.columnNames.length + 1).toString()] } : c) };
      }
      return baseSub;
    }));
    // TODO: Add API call to update base subject
  };

  const removeColumnFromCategory = (subjectId, categoryId) => {
    // This should ideally update the base subject template via API
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) { // Assuming subjectId here refers to baseSubjectId
        return { ...baseSub, categories: baseSub.categories.map(c => (c.id === categoryId && c.columnNames.length > 2) ? { ...c, columnNames: c.columnNames.slice(0, -1) } : c) };
      }
      return baseSub;
    }));
    // TODO: Add API call to update base subject
  };

  const resetSubjectTemplate = (id) => {
    // This should ideally update the base subject template via API
    setBaseSubjects(prev => prev.map(baseSub => baseSub.id === id ? { ...baseSub, categories: [
      { id: `cat-ww-${Date.now()}`, name: 'WRITTEN WORKS', weight: 0.3, columnNames: ['1','2','3','4','5'] },
      { id: `cat-pt-${Date.now()}`, name: 'PERFORMANCE TASKS', weight: 0.5, columnNames: ['1','2','3','4','5'] },
      { id: `cat-qa-${Date.now()}`, name: 'QUARTERLY ASSESSMENT', weight: 0.2, columnNames: ['1'] },
    ] } : baseSub));
    // TODO: Add API call to update base subject
  };

  // Function for enrolling a student to a specific section (used by AdvisoryDashboardView)
  const addStudentToSection = async (name, gender, sectionId) => {
    try {
      const newStudent = await studentService.createStudent({ name, gender, sectionId, grades: {} });
      setStudents(prev => [...prev, normalize(newStudent)]);
    } catch (error) {
      console.error("Failed to add student to section:", error);
      throw error;
    }
  };

  const removeStudent = async (id) => {
    try {
      await studentService.deleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error("Failed to remove student:", error);
      throw error;
    }
  };

  // New function for overall student registration (not necessarily assigned to a section yet)
  const enrollStudentOverall = async (lastName, firstName, middleName, gender, gradeLevel, schoolYear) => {
    const fullName = `${lastName.trim()}, ${firstName.trim()} ${middleName.trim()}`.toUpperCase().trim();
    const newStudent = {
      name: fullName,
      gender,
      gradeLevel,
      schoolYear,
      sectionId: null, // Initially unassigned
      grades: {}
    };
    try {
      const createdStudent = await studentService.createStudent(newStudent);
      setStudents(prev => [...prev, normalize(createdStudent)]);
    } catch (error) {
      console.error("Failed to enroll student:", error);
      throw error;
    }
  };

  const assignStudentToSection = async (studentId, sectionId) => {
    try {
      const updatedStudent = await studentService.assignStudentToSection(studentId, sectionId);
      setStudents(prev => prev.map(s => s.id === studentId ? normalize(updatedStudent) : s));
    } catch (error) {
      console.error("Failed to assign student to section:", error);
      throw error;
    }
  };

  const updateStudent = async (studentId, data) => {
    try {
      const updatedStudent = await studentService.updateStudent(studentId, data);
      setStudents(prev => prev.map(s => s.id === studentId ? normalize(updatedStudent) : s));
    } catch (error) {
      console.error("Failed to update student:", error);
      throw error;
    }
  };

  return { 
    students, updateGrade, updateCategoryTitle, updateCategoryWeight, updateColumnName, addCategory, removeCategory, addColumnToCategory, removeColumnFromCategory, resetSubjectTemplate, 
    addStudentToSection, removeStudent, enrollStudentOverall, assignStudentToSection, updateStudent
  };
}
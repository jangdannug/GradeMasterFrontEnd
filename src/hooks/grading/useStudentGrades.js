import { useState, useEffect, useCallback } from 'react';
import studentService from '../../services/studentService';
import subjectService from '../../services/subjectService';
import authService from '../../services/authService';

// Helper to normalize Student properties (bridging C# PascalCase/snake_case to frontend camelCase)
const normalizeStudent = (item) => {
  if (!item) return null;
  return {
    ...item,
    id: item.id || item.Id,
    name: item.name || item.Name,
    gender: item.gender || item.Gender,
    gradeLevel: item.gradeLevel || item.GradeLevel || item.grade_level,
    schoolYear: item.schoolYear || item.SchoolYear || item.school_year,
    sectionId: item.sectionId || item.SectionId || item.section_id,
    grades: (typeof item.grades === 'string' ? JSON.parse(item.grades) : (item.grades || item.Grades)) || {}
  };
};

export function useStudentGrades(subjects, setSubjects, setBaseSubjects, currentUser) {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);

  const syncStudents = useCallback(async () => {
    const activeUser = currentUser || authService.getProfile();
    if (activeUser && authService.isLoggedIn()) {
      setError(null);
      try {
        const data = await studentService.getStudents();
        setStudents(Array.isArray(data) ? data.map(normalizeStudent) : []);
      } catch (error) {
        console.error("Failed to fetch students:", error);
        setError(error);
      }
    }
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
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return { ...baseSub, categories: baseSub.categories.map(c => c.id === categoryId ? { ...c, name: title } : c) };
      }
      return baseSub;
    }));
  };

  const updateCategoryWeight = (subjectId, categoryId, weight) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return { ...baseSub, categories: baseSub.categories.map(c => c.id === categoryId ? { ...c, weight: weight / 100 } : c) };
      }
      return baseSub;
    }));
  };

  const updateColumnName = (subjectId, categoryId, index, name) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return { ...baseSub, categories: baseSub.categories.map(c => {
          if (c.id !== categoryId) return c;
          const names = [...(c.columnNames || [])];
          names[index] = name;
          return { ...c, columnNames: names };
        }) };
      }
      return baseSub;
    }));
  };

  const addCategory = (subjectId) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return { ...baseSub, categories: [...baseSub.categories, { id: `cat-${Date.now()}`, name: 'NEW', weight: 0.1, columnNames: ['1','2','3'] }] };
      }
      return baseSub;
    }));
  };

  const removeCategory = (subjectId, categoryId) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return { ...baseSub, categories: baseSub.categories.filter(c => c.id !== categoryId) };
      }
      return baseSub;
    }));
  };

  const addColumnToCategory = (subjectId, categoryId) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return { ...baseSub, categories: baseSub.categories.map(c => c.id === categoryId ? { ...c, columnNames: [...c.columnNames, (c.columnNames.length + 1).toString()] } : c) };
      }
      return baseSub;
    }));
  };

  const removeColumnFromCategory = (subjectId, categoryId) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return { ...baseSub, categories: baseSub.categories.map(c => (c.id === categoryId && c.columnNames.length > 2) ? { ...c, columnNames: c.columnNames.slice(0, -1) } : c) };
      }
      return baseSub;
    }));
  };

  const resetSubjectTemplate = (id) => {
    const defaultCategories = [
      { id: `cat-ww-${Date.now()}`, name: 'WRITTEN WORKS', weight: 0.3, columnNames: ['1','2','3','4','5'] },
      { id: `cat-pt-${Date.now()}`, name: 'PERFORMANCE TASKS', weight: 0.5, columnNames: ['1','2','3','4','5'] },
      { id: `cat-qa-${Date.now()}`, name: 'QUARTERLY ASSESSMENT', weight: 0.2, columnNames: ['1'] },
    ];

    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === id) {
        return { ...baseSub, categories: defaultCategories };
      }
      return baseSub;
    }));
  };

  // Function for enrolling a student to a specific section (used by AdvisoryDashboardView)
  const addStudentToSection = async (name, gender, sectionId) => {
    try {
      setError(null);
      const newStudent = await studentService.createStudent({ name, gender, sectionId, grades: {} });
      setStudents(prev => [...prev, normalizeStudent(newStudent)]);
    } catch (error) {
      console.error("Failed to add student to section:", error);
      setError(error);
      throw error; // Re-throw to allow UI to handle
    }
  };

  const removeStudent = async (id) => {
    try {
      await studentService.deleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to remove student:", err);
      setError(err);
      throw err; // Re-throw to allow UI to handle
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
      setError(null);
      const createdStudent = await studentService.createStudent(newStudent);
      setStudents(prev => [...prev, normalizeStudent(createdStudent)]);
    } catch (error) {
      console.error("Failed to enroll student:", error);
      setError(error);
      throw error; // Re-throw to allow UI to handle
    }
  };

  const assignStudentToSection = async (studentId, sectionId) => {
    try {
      const updatedStudent = await studentService.assignStudentToSection(studentId, sectionId);
      setStudents(prev => prev.map(s => s.id === studentId ? normalizeStudent(updatedStudent) : s));
    } catch (err) {
      console.error("Failed to assign student to section:", err);
      setError(err);
      throw err; // Re-throw to allow UI to handle
    }
  };

  const updateStudent = async (studentId, data) => {
    try {
      setError(null);
      const updatedStudent = await studentService.updateStudent(studentId, data);
      setStudents(prev => prev.map(s => s.id === studentId ? normalizeStudent(updatedStudent) : s));
    } catch (err) {
      console.error("Failed to update student:", err);
      setError(err);
      throw err; // Re-throw to allow UI to handle
    }
  };

  return {
    students, syncStudents, updateGrade, updateCategoryTitle, updateCategoryWeight, updateColumnName, addCategory, removeCategory, addColumnToCategory, removeColumnFromCategory, resetSubjectTemplate,
    addStudentToSection, removeStudent, enrollStudentOverall, assignStudentToSection, updateStudent,
    error // Expose error state
  };
}
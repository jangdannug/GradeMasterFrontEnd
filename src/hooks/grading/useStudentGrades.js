import { useState, useEffect } from 'react';
import studentService from '../../services/studentService';
import subjectService from '../../services/subjectService';
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

  const updateCategoryTitle = async (subjectId, categoryId, title) => {
    // Update local state first for immediate UI feedback
    let updatedSubject = null;
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        const updated = { ...baseSub, categories: baseSub.categories.map(c => c.id === categoryId ? { ...c, name: title } : c) };
        updatedSubject = updated;
        return updated;
      }
      return baseSub;
    }));

    // Persist to backend with complete template data
    if (updatedSubject) {
      try {
        await subjectService.updateBaseSubject(subjectId, {
          name: updatedSubject.name,
          code: updatedSubject.code,
          gradeLevel: updatedSubject.gradeLevel,
          categoriesJson: JSON.stringify(updatedSubject.categories),
          pushToInstances: false
        });
      } catch (error) {
        console.error("Failed to update category title via API:", error);
      }
    }
  };

  const updateCategoryWeight = async (subjectId, categoryId, weight) => {
    // Update local state first for immediate UI feedback
    let updatedSubject = null;
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        const updated = { ...baseSub, categories: baseSub.categories.map(c => c.id === categoryId ? { ...c, weight: weight / 100 } : c) };
        updatedSubject = updated;
        return updated;
      }
      return baseSub;
    }));

    // Persist to backend with complete template data
    if (updatedSubject) {
      try {
        await subjectService.updateBaseSubject(subjectId, {
          name: updatedSubject.name,
          code: updatedSubject.code,
          gradeLevel: updatedSubject.gradeLevel,
          categoriesJson: JSON.stringify(updatedSubject.categories),
          pushToInstances: false
        });
      } catch (error) {
        console.error("Failed to update category weight via API:", error);
      }
    }
  };

  const updateColumnName = async (subjectId, categoryId, index, name) => {
    // Update local state first for immediate UI feedback
    let updatedSubject = null;
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        const updated = { ...baseSub, categories: baseSub.categories.map(c => {
          if (c.id !== categoryId) return c;
          const names = [...(c.columnNames || [])];
          names[index] = name;
          return { ...c, columnNames: names };
        }) };
        updatedSubject = updated;
        return updated;
      }
      return baseSub;
    }));

    // Persist to backend with complete template data
    if (updatedSubject) {
      try {
        await subjectService.updateBaseSubject(subjectId, {
          name: updatedSubject.name,
          code: updatedSubject.code,
          gradeLevel: updatedSubject.gradeLevel,
          categoriesJson: JSON.stringify(updatedSubject.categories),
          pushToInstances: false
        });
      } catch (error) {
        console.error("Failed to update column name via API:", error);
      }
    }
  };

  const addCategory = async (subjectId) => {
    // Update local state first for immediate UI feedback
    let updatedSubject = null;
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        const updated = { ...baseSub, categories: [...baseSub.categories, { id: `cat-${Date.now()}`, name: 'NEW', weight: 0.1, columnNames: ['1','2','3'] }] };
        updatedSubject = updated;
        return updated;
      }
      return baseSub;
    }));

    // Persist to backend with complete template data
    if (updatedSubject) {
      try {
        await subjectService.updateBaseSubject(subjectId, {
          name: updatedSubject.name,
          code: updatedSubject.code,
          gradeLevel: updatedSubject.gradeLevel,
          categoriesJson: JSON.stringify(updatedSubject.categories),
          pushToInstances: false
        });
      } catch (error) {
        console.error("Failed to add category via API:", error);
      }
    }
  };

  const removeCategory = async (subjectId, categoryId) => {
    // Update local state first for immediate UI feedback
    let updatedSubject = null;
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        const updated = { ...baseSub, categories: baseSub.categories.filter(c => c.id !== categoryId) };
        updatedSubject = updated;
        return updated;
      }
      return baseSub;
    }));

    // Persist to backend with complete template data
    if (updatedSubject) {
      try {
        await subjectService.updateBaseSubject(subjectId, {
          name: updatedSubject.name,
          code: updatedSubject.code,
          gradeLevel: updatedSubject.gradeLevel,
          categoriesJson: JSON.stringify(updatedSubject.categories),
          pushToInstances: false
        });
      } catch (error) {
        console.error("Failed to remove category via API:", error);
      }
    }
  };

  const addColumnToCategory = async (subjectId, categoryId) => {
    // Update local state first for immediate UI feedback
    let updatedSubject = null;
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        const updated = { ...baseSub, categories: baseSub.categories.map(c => c.id === categoryId ? { ...c, columnNames: [...c.columnNames, (c.columnNames.length + 1).toString()] } : c) };
        updatedSubject = updated;
        return updated;
      }
      return baseSub;
    }));

    // Persist to backend with complete template data
    if (updatedSubject) {
      try {
        await subjectService.updateBaseSubject(subjectId, {
          name: updatedSubject.name,
          code: updatedSubject.code,
          gradeLevel: updatedSubject.gradeLevel,
          categoriesJson: JSON.stringify(updatedSubject.categories),
          pushToInstances: false
        });
      } catch (error) {
        console.error("Failed to add column via API:", error);
      }
    }
  };

  const removeColumnFromCategory = async (subjectId, categoryId) => {
    // Update local state first for immediate UI feedback
    let updatedSubject = null;
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        const updated = { ...baseSub, categories: baseSub.categories.map(c => (c.id === categoryId && c.columnNames.length > 2) ? { ...c, columnNames: c.columnNames.slice(0, -1) } : c) };
        updatedSubject = updated;
        return updated;
      }
      return baseSub;
    }));

    // Persist to backend with complete template data
    if (updatedSubject) {
      try {
        await subjectService.updateBaseSubject(subjectId, {
          name: updatedSubject.name,
          code: updatedSubject.code,
          gradeLevel: updatedSubject.gradeLevel,
          categoriesJson: JSON.stringify(updatedSubject.categories),
          pushToInstances: false
        });
      } catch (error) {
        console.error("Failed to remove column via API:", error);
      }
    }
  };

  const resetSubjectTemplate = async (id) => {
    const defaultCategories = [
      { id: `cat-ww-${Date.now()}`, name: 'WRITTEN WORKS', weight: 0.3, columnNames: ['1','2','3','4','5'] },
      { id: `cat-pt-${Date.now()}`, name: 'PERFORMANCE TASKS', weight: 0.5, columnNames: ['1','2','3','4','5'] },
      { id: `cat-qa-${Date.now()}`, name: 'QUARTERLY ASSESSMENT', weight: 0.2, columnNames: ['1'] },
    ];

    // Get the subject being reset to access its name, code, gradeLevel
    let updatedSubject = null;
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === id) {
        const updated = { ...baseSub, categories: defaultCategories };
        updatedSubject = updated;
        return updated;
      }
      return baseSub;
    }));

    // Persist to backend with complete template data
    if (updatedSubject) {
      try {
        await subjectService.updateBaseSubject(id, {
          name: updatedSubject.name,
          code: updatedSubject.code,
          gradeLevel: updatedSubject.gradeLevel,
          categoriesJson: JSON.stringify(defaultCategories),
          pushToInstances: false
        });
      } catch (error) {
        console.error("Failed to reset subject template via API:", error);
      }
    }
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
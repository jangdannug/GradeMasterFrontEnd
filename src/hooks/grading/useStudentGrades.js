import { useState, useCallback, useEffect } from 'react';
import studentService from '../../services/studentService';
import subjectService from '../../services/subjectService'; // Needed for applyClassRecordDraft
import authService from '../../services/authService';

// Helper to normalize Student properties (bridging C# PascalCase/snake_case to frontend camelCase)
const normalizeStudent = (item) => {
  if (!item) return null;

  // Fix for LRN scientific notation (e.g., 1.23457E+11)
  const rawLrn = item.lrn || item.LRN || '';
  let lrn = String(rawLrn);
  if (lrn.toUpperCase().includes('E+')) {
    const num = Number(rawLrn);
    lrn = !isNaN(num) ? num.toLocaleString('fullwide', { useGrouping: false }) : lrn;
  }

  return {
    ...item,
    id: item.id || item.Id,
    lrn: lrn,
    firstName: item.firstName || item.FirstName || item.first_name || '',
    lastName: item.lastName || item.LastName || item.last_name || '',
    middleName: item.middleName || item.MiddleName || item.middle_name || '',
    name: item.name || item.Name,
    gender: item.gender || item.Gender,
    birthdate: item.birthdate || item.Birthdate || item.birth_date || '',
    address: item.address || item.Address || '',
    motherTongue: item.motherTongue || item.MotherTongue || item.mother_tongue || '',
    religion: item.religion || item.Religion || '',
    ethnicGroup: item.ethnicGroup || item.EthnicGroup || item.ethnic_group || '',
    hasDisability: item.hasDisability || item.HasDisability || item.has_disability || false,
    gradeLevel: item.gradeLevel || item.GradeLevel || item.grade_level,
    schoolYear: item.schoolYear || item.SchoolYear || item.school_year,
    sectionId: item.sectionId ?? item.SectionId ?? item.section_id ?? null,
    grades: (typeof item.grades === 'string' ? JSON.parse(item.grades) : (item.grades || item.Grades)) || {},
    schoolId: item.schoolId || item.SchoolId || item.school_id
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

  // Helper function to find and update categories, handling composite structure
  const updateCategoriesInBaseSubject = useCallback((baseSub, categoryId, componentId, updateFn) => {
    if (!baseSub) return baseSub;

    const isComposite = (baseSub.categories || []).some(c => c.isComponent);

    if (isComposite && componentId) {
      return {
        ...baseSub,
        categories: baseSub.categories.map(comp => {
          if (comp.id === componentId) {
            return { ...comp, categories: updateFn(comp.categories || []) };
          }
          return comp;
        })
      };
    } else if (!isComposite) {
      return { ...baseSub, categories: updateFn(baseSub.categories || []) };
    }
    return baseSub; // No change if composite but no componentId, or if component not found
  }, []);

  const updateGrade = useCallback((studentId, subjectId, categoryId, type, index, value, quarter) => {
    setStudents(prev => prev.map(student => {
      // Use String coercion to prevent mismatch between CSV strings and state IDs
      if (studentId !== 'HPS' && String(student.id) !== String(studentId)) return student;

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
        const nextHps = [...(current.hps || [])];
        nextHps[index] = value || 0;
        current.hps = nextHps;
      } else if (studentId !== 'HPS') {
        const nextScores = [...(current.scores || [])];
        nextScores[index] = { points: value };
        current.scores = nextScores;
      }

      catGrades[categoryId] = current;
      quarterGrades.categoryGrades = catGrades;
      subGrades[quarter] = quarterGrades;
      grades[subjectId] = subGrades;
      return { ...student, grades };
    }));
  }, []);

  const updateCategoryTitle = useCallback((subjectId, categoryId, title, componentId = null) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return updateCategoriesInBaseSubject(baseSub, categoryId, componentId, (currentCategories) =>
          currentCategories.map(c => c.id === categoryId ? { ...c, name: title } : c)
        );
      }
      return baseSub;
    }));
  }, [setBaseSubjects, updateCategoriesInBaseSubject]);

  const updateCategoryWeight = useCallback((subjectId, categoryId, weight, componentId = null) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return updateCategoriesInBaseSubject(baseSub, categoryId, componentId, (currentCategories) =>
          currentCategories.map(c => c.id === categoryId ? { ...c, weight: weight / 100 } : c)
        );
      }
      return baseSub;
    }));
  }, [setBaseSubjects, updateCategoriesInBaseSubject]);

  const updateColumnName = useCallback((subjectId, categoryId, index, name, componentId = null) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return updateCategoriesInBaseSubject(baseSub, categoryId, componentId, (currentCategories) =>
          currentCategories.map(c => {
            if (c.id !== categoryId) return c;
            const names = [...(c.columnNames || [])];
            names[index] = name;
            return { ...c, columnNames: names };
          })
        );
      }
      return baseSub;
    }));
  }, [setBaseSubjects, updateCategoriesInBaseSubject]);

  const addCategory = useCallback((subjectId, componentId = null) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return updateCategoriesInBaseSubject(baseSub, null, componentId, (currentCategories) =>
          [...currentCategories, { id: `cat-${Date.now()}`, name: 'NEW', weight: 0.1, columnNames: ['1','2','3'] }]
        );
      }
      return baseSub;
    }));
  }, [setBaseSubjects, updateCategoriesInBaseSubject]);

  const removeCategory = useCallback((subjectId, categoryId, componentId = null) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return updateCategoriesInBaseSubject(baseSub, categoryId, componentId, (currentCategories) =>
          currentCategories.filter(c => c.id !== categoryId)
        );
      }
      return baseSub;
    }));
  }, [setBaseSubjects, updateCategoriesInBaseSubject]);

  const addColumnToCategory = useCallback((subjectId, categoryId, componentId = null) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return updateCategoriesInBaseSubject(baseSub, categoryId, componentId, (currentCategories) =>
          currentCategories.map(c => c.id === categoryId ? { ...c, columnNames: [...c.columnNames, (c.columnNames.length + 1).toString()] } : c)
        );
      }
      return baseSub;
    }));
  }, [setBaseSubjects, updateCategoriesInBaseSubject]);

  const removeColumnFromCategory = useCallback((subjectId, categoryId, componentId = null) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return updateCategoriesInBaseSubject(baseSub, categoryId, componentId, (currentCategories) =>
          currentCategories.map(c => (c.id === categoryId && c.columnNames.length > 2) ? { ...c, columnNames: c.columnNames.slice(0, -1) } : c)
        );
      }
      return baseSub;
    }));
  }, [setBaseSubjects, updateCategoriesInBaseSubject]);

  const resetSubjectTemplate = useCallback((id, componentId = null) => {
    const defaultCategories = [
      { id: `cat-ww-${Date.now()}`, name: 'WRITTEN WORKS', weight: 0.2, columnNames: ['1','2','3','4','5'] },
      { id: `cat-pt-${Date.now()}`, name: 'PERFORMANCE TASKS', weight: 0.6, columnNames: ['1','2','3','4','5'] },
      { id: `cat-qa-${Date.now()}`, name: 'QUARTERLY ASSESSMENT', weight: 0.2, columnNames: ['ST1','ST2','TE'] },
    ];

    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === id) {
        return updateCategoriesInBaseSubject(baseSub, null, componentId, () => defaultCategories);
      }
      return baseSub;
    }));
  }, [setBaseSubjects, updateCategoriesInBaseSubject]);

  const addComponentToSubject = useCallback((subjectId, componentName) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        const newComponent = {
          id: `comp-${Date.now()}`,
          name: componentName.toUpperCase(),
          isComponent: true,
          categories: [
            { id: `cat-ww-${Date.now()}-new`, name: 'WRITTEN WORKS', weight: 0.3, columnNames: ['1','2','3','4','5'] },
            { id: `cat-pt-${Date.now()}-new`, name: 'PERFORMANCE TASKS', weight: 0.5, columnNames: ['1','2','3','4','5'] },
            { id: `cat-qa-${Date.now()}-new`, name: 'QUARTERLY ASSESSMENT', weight: 0.2, columnNames: ['1'] },
          ]
        };
        return { ...baseSub, categories: [...(baseSub.categories || []), newComponent] };
      }
      return baseSub;
    }));
  }, [setBaseSubjects]);

  const removeComponentFromSubject = useCallback((subjectId, componentId) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return { ...baseSub, categories: baseSub.categories.filter(comp => comp.id !== componentId) };
      }
      return baseSub;
    }));
  }, [setBaseSubjects]);

  const updateComponentTeacher = useCallback((subjectId, componentId, teacherId) => {
    const updater = (prev) => prev.map(sub => {
      if (sub.id === subjectId) {
        return {
          ...sub,
          categories: (sub.categories || []).map(comp =>
            comp.id === componentId ? { ...comp, teacherId } : comp
          )
        };
      }
      return sub;
    });
    setBaseSubjects(updater);
    setSubjects(updater);
  }, [setBaseSubjects, setSubjects]);

  const updateComponentName = useCallback((subjectId, componentId, newName) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        return {
          ...baseSub,
          categories: baseSub.categories.map(comp =>
            comp.id === componentId ? { ...comp, name: newName.toUpperCase() } : comp
          )
        };
      }
      return baseSub;
    }));
  }, [setBaseSubjects]);

  const convertToComposite = useCallback((subjectId) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        const initialComponent = {
          id: `comp-${Date.now()}-1`,
          name: "COMPONENT 1",
          isComponent: true,
          categories: baseSub.categories || [] // Move existing categories into the first component
        };
        const secondComponent = {
          id: `comp-${Date.now()}-2`,
          name: "COMPONENT 2",
          isComponent: true,
          categories: [
            { id: `cat-ww-${Date.now()}-new`, name: 'WRITTEN WORKS', weight: 0.3, columnNames: ['1','2','3','4','5'] },
            { id: `cat-pt-${Date.now()}-new`, name: 'PERFORMANCE TASKS', weight: 0.5, columnNames: ['1','2','3','4','5'] },
            { id: `cat-qa-${Date.now()}-new`, name: 'QUARTERLY ASSESSMENT', weight: 0.2, columnNames: ['1'] },
          ]
        };
        return { ...baseSub, categories: [initialComponent, secondComponent] };
      }
      return baseSub;
    }));
  }, [setBaseSubjects]);

  const convertToNonComposite = useCallback((subjectId) => {
    setBaseSubjects(prev => prev.map(baseSub => {
      if (baseSub.id === subjectId) {
        // For simplicity, just take the categories from the first component
        const firstComponentCategories = baseSub.categories.find(c => c.isComponent)?.categories || [];
        return { ...baseSub, categories: firstComponentCategories };
      }
      return baseSub;
    }));
  }, [setBaseSubjects]);

  // Function for enrolling a student to a specific section (used by AdvisoryDashboardView)
  const addStudentToSection = useCallback(async (name, gender, sectionId) => {
    try {
      setError(null);
      const newStudent = await studentService.createStudent({ name, gender, sectionId, grades: {} });
      setStudents(prev => [...prev, normalizeStudent(newStudent)]);
    } catch (error) {
      console.error("Failed to add student to section:", error);
      setError(error);
      throw error; // Re-throw to allow UI to handle
    }
  }, []);

  const bulkEnrollStudents = useCallback(async (file, schoolYear, schoolId) => {
    try {
      setError(null);
      const result = await studentService.bulkUploadStudents(file, schoolYear, null, schoolId);
      await syncStudents(); // Refresh the list after bulk upload
      return result;
    } catch (err) {
      console.error("Bulk enrollment failed:", err);
      setError(err);
      throw err;
    }
  }, [syncStudents]);

  const removeStudent = useCallback(async (id) => {
    try {
      await studentService.deleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to remove student:", err);
      setError(err);
      throw err; // Re-throw to allow UI to handle
    }
  }, []);


  // New function for overall student registration (not necessarily assigned to a section yet)
  const enrollStudentOverall = useCallback(async (studentData) => {
    const { 
        lastName, firstName, middleName, lrn, gender, 
        gradeLevel, schoolYear, schoolId, birthdate,
        address, motherTongue, religion, ethnicGroup, hasDisability 
    } = studentData;
    
    const fullName = `${lastName.trim()}, ${firstName.trim()} ${middleName.trim()}`.toUpperCase().trim();
    const newStudent = {
      name: fullName,
      firstName: firstName.toUpperCase(),
      lastName: lastName.toUpperCase(),
      middleName: middleName.toUpperCase(),
      lrn: lrn,
      gender,
      gradeLevel,
      schoolYear,
      schoolId,
      birthdate,
      address: address?.toUpperCase(),
      motherTongue: motherTongue?.toUpperCase(),
      religion: religion?.toUpperCase(),
      ethnicGroup: ethnicGroup?.toUpperCase(),
      hasDisability,
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
  }, []);

  const assignStudentToSection = useCallback(async (studentId, sectionId) => {
    try {
      const updatedStudent = await studentService.assignStudentToSection(studentId, sectionId);
      setStudents(prev => prev.map(s => s.id === studentId ? normalizeStudent(updatedStudent) : s));
    } catch (err) {
      console.error("Failed to assign student to section:", err);
      setError(err);
      throw err; // Re-throw to allow UI to handle
    }
  }, []);

  const updateStudent = useCallback(async (studentId, data) => {
    try {
      setError(null);
      const updatedStudent = await studentService.updateStudent(studentId, data);
      setStudents(prev => prev.map(s => s.id === studentId ? normalizeStudent(updatedStudent) : s));
    } catch (err) {
      console.error("Failed to update student:", err);
      setError(err);
      throw err; // Re-throw to allow UI to handle
    }
  }, []);

  const applyClassRecordDraft = useCallback((draftRecord, subjectId, quarter, isCompositeSubject = false) => {
    if (!draftRecord?.studentSnapshots) return;

    const snapshotMap = Object.fromEntries(
      (draftRecord.studentSnapshots || []).map(snapshot => [String(snapshot.id || snapshot.Id), snapshot])
    );

    setStudents(prev => {
      const merged = (prev || []).map(student => {
        const snapshot = snapshotMap[String(student.id)];
        if (!snapshot) return student;
        
        const grades = { ...(student.grades || {}) };
        const subGrades = { ...(grades[subjectId] || {}) };
        
        // Robustly pick up grades regardless of casing from the normalized snapshot
        let snapshotData = snapshot.grades || snapshot.Grades || {};

        // If it's a composite subject, the snapshot data might be nested under 'components'
        // For now, the `updateGrade` function doesn't differentiate, it just updates the `categoryGrades`
        // So, if the snapshot has a `components` array, we need to extract the relevant `categoryGrades`
        // This part might need more refinement depending on how `snapshot.grades` is structured for composite subjects.
        // For now, `updateGrade` expects `categoryGrades` directly.
        if (isCompositeSubject && snapshotData.components) {
          // This is a simplification. The `updateGrade` function needs to know which component's categories to update.
          // For now, we'll just pass the top-level `categoryGrades` if they exist.
        }
        subGrades[quarter] = { ...(subGrades[quarter] || {}), ...snapshotData };
        grades[subjectId] = subGrades;

        return { ...student, grades };
      });

      const existingIds = new Set(merged.map(s => String(s.id)));
      const missingSnapshots = Object.values(snapshotMap).filter(snapshot => !existingIds.has(String(snapshot.id)));
      if (missingSnapshots.length > 0) {
        const addedStudents = missingSnapshots.map(normalizeStudent);
        return [...merged, ...addedStudents];
      }

      return merged;
    });
  }, []);
  
  return {
    students,
    setStudents,
    syncStudents,
    applyClassRecordDraft,
    updateGrade,
    updateCategoryTitle,
    updateCategoryWeight,
    updateColumnName,
    addCategory,
    removeCategory,
    addColumnToCategory,
    removeColumnFromCategory,
    resetSubjectTemplate,
    addStudentToSection,
    removeStudent,
    enrollStudentOverall,
    bulkEnrollStudents,
    assignStudentToSection,
    updateStudent,
    error, // Expose error state
    addComponentToSubject,
    removeComponentFromSubject,
    updateComponentName,
    convertToComposite,
    convertToNonComposite,
    updateComponentTeacher
  };
}
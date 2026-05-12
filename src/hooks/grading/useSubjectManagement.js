import { useState, useEffect, useCallback } from 'react';
import authService from '../../services/authService';
import subjectService from '../../services/subjectService';

// Helper to safely get categories as an array
const getCategoriesAsArray = (item) => {
  // Check all variations: lowercase, PascalCase, and with 'Json' suffix
  const raw = item.categories ?? item.Categories ?? item.categoriesJson ?? item.CategoriesJson;

  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    try {
      let parsed = JSON.parse(raw);
      // Handle potential double-stringification from backend serializers
      if (typeof parsed === 'string' && parsed.trim() !== '') parsed = JSON.parse(parsed); // Double parse if needed
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("[getCategoriesAsArray] Failed to parse categories string:", raw, e);
      console.error("Failed to parse categories string:", raw, e);
    }
  }
  return [];
};

// Helper to normalize Base Subject (Template) properties
const normalizeBaseSubject = (item) => {
  const categories = getCategoriesAsArray(item);
  console.log(`[normalizeBaseSubject] Normalized ${item.name || item.Name} (ID: ${item.id || item.Id}): isComposite=${categories?.some(c => c.isComponent)}`);
  return {
    ...item,
    id: item.id || item.Id,
    name: item.name || item.Name,
    code: item.code || item.Code,
    gradeLevel: item.gradeLevel || item.GradeLevel || item.grade_level,
    categories,
    schoolId: item.schoolId || item.SchoolId || item.school_id
  };
};

// Helper to normalize Subject Instance properties
const normalizeSubject = (item) => {
  const categories = getCategoriesAsArray(item);
  console.log(`[normalizeSubject] Normalized ${item.name || item.Name} (ID: ${item.id || item.Id}): isComposite=${categories?.some(c => c.isComponent)}`);
  return {
    ...item,
    id: item.id || item.Id,
    baseSubjectId: item.baseSubjectId || item.BaseSubjectId || item.base_subject_id,
    sectionId: item.sectionId ?? item.SectionId ?? item.section_id ?? null,
    teacherId: item.teacherId || item.TeacherId || item.teacher_id,
    teacherName: item.teacherName || item.TeacherName || item.teacher_name,
    name: item.name || item.Name,
    code: item.code || item.Code,
    gradeLevel: item.gradeLevel || item.GradeLevel || item.grade_level,
    categories,
    schoolId: item.schoolId || item.SchoolId || item.school_id
  };
};

export function useSubjectManagement(users, setUsers) {
  const [subjects, setSubjects] = useState([]);
  const [baseSubjects, setBaseSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [loading, setLoading] = useState(false); // Add a general loading state for the hook
  const [subjectsError, setSubjectsError] = useState(null); // Combined error for subjects and baseSubjects

  const syncSubjects = useCallback(async () => {
    if (!authService.isLoggedIn()) return;
    setSubjectsLoading(true);
    setSubjectsError(null);
    try {
      setLoading(true); // Set general loading state
      const data = await subjectService.getBaseSubjects();
      setBaseSubjects(data.map(normalizeBaseSubject));

      const fetchedSubjects = await subjectService.getSubjects();
      console.log("[useSubjectManagement] Raw subjects from API:", fetchedSubjects);
      setSubjects(fetchedSubjects.map(normalizeSubject));
    } catch (error) {
      console.error('Failed to fetch subjects data:', error);
      setSubjectsError(error.message);
    } finally {
      setLoading(false); // Reset general loading state
      setSubjectsLoading(false);
    }
  }, [authService.isLoggedIn]);

  // Automatic synchronization: When any template changes, update all corresponding class records
  useEffect(() => {
    if (!baseSubjects || subjectsLoading) return; // Don't sync if still loading base subjects

    setSubjects(prevSubjects => {
      let hasStructuralChanges = false;
      const syncedSubjects = prevSubjects.map(sub => {
        // Match template by code and grade level
        const template = baseSubjects.find(b => String(b.id) === String(sub.baseSubjectId));
        if (!template) return sub;

        // Compare structure (categories and name)
        const templateCatsJson = JSON.stringify(template.categories);
        const subCatsJson = JSON.stringify(sub.categories);

        if (templateCatsJson !== subCatsJson || sub.name !== template.name) {
          // Only sync if the template actually has a grading structure defined.
          // This prevents unconfigured base templates from wiping out 
          // composite subject structures on instances.
          const templateIsConfigured = template.categories && template.categories.length > 0;
          const isInstanceComposite = sub.categories?.some(c => c.isComponent);
          
          console.log(`[useSubjectManagement] Sync check for ${sub.name}:`, {
            templateIsConfigured,
            isInstanceComposite,
            willSync: templateIsConfigured || !isInstanceComposite
          });

          if (templateIsConfigured || !isInstanceComposite) {
            hasStructuralChanges = true;
            return { ...sub, name: template.name, categories: JSON.parse(templateCatsJson) };
          }
        }
        return sub;
      });

      return hasStructuralChanges ? syncedSubjects : prevSubjects;
    });
  }, [baseSubjects]);

  const syncInstancesWithTemplate = useCallback((updatedBase) => { // Memoize this function
    setSubjects(prev => prev.map(sub => {
      if (sub.baseSubjectId === updatedBase.id) { // Match by baseSubjectId
        return { ...sub, categories: JSON.parse(JSON.stringify(updatedBase.categories)), name: updatedBase.name };
      }
      return sub;
    }));
  }, []); // No dependencies needed if setSubjects is stable

  const createBaseSubject = async (data) => {
    try {
      setLoading(true); // Set loading for this specific action
      setSubjectsError(null);
      await subjectService.createBaseSubject(data);
      
      // Re-fetch all subjects to ensure state consistency with the database
      await syncSubjects();
    } catch (err) {
      console.error('Failed to create base subject:', err);
      setSubjectsError(err.message);
      throw err;
    } finally {
      setLoading(false); // Reset loading
    }
  };

  const updateBaseSubject = async (id, data) => {
    try {
      setLoading(true); // Set loading for this specific action
      setSubjectsError(null);
      await subjectService.updateBaseSubject(id, data);
      
      // Re-fetch to ensure the UI has the correct structure from the DB
      // This automatically triggers the useEffect that syncs active instances
      await syncSubjects();
    } catch (err) {
      console.error('Failed to update base subject:', err);
      setSubjectsError(err.message);
      throw err;
    } finally {
      setLoading(false); // Reset loading
    }
  };

  const deleteBaseSubject = async (id) => {
    try {
      setLoading(true); // Set loading for this specific action
      setSubjectsError(null);
      await subjectService.deleteBaseSubject(id);
      setBaseSubjects(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Failed to delete base subject:', err);
      setSubjectsError(err.message);
      throw err;
    } finally {
      setLoading(false); // Reset loading
    }
  };

  const addSubject = async (data) => {
    // Support both casings during lookup
    const baseId = data.BaseSubjectId || data.baseSubjectId;
    const base = baseSubjects.find(b => String(b.id) === String(baseId));
    if (!base) return;

    // Prevent adding duplicate subject to the same section
    const sectionId = data.SectionId || data.sectionId;
    const existingSubject = subjects.find(s =>
      s.code === base.code &&
      s.gradeLevel === base.gradeLevel &&
      String(s.sectionId) === String(sectionId)
    );

    if (existingSubject) {
      console.warn(`Subject ${base.name} (Code: ${base.code}) already exists in section ${sectionId}.`);
      return; // Do not add the subject if a duplicate exists
    }

    // Prepare payload for API (Strictly PascalCase to match CreateSubjectRequest DTO)
    const newSub = {
      Name: base.name,
      Code: base.code,
      GradeLevel: base.gradeLevel,
      SectionId: Number(sectionId),
      BaseSubjectId: Number(baseId),
      TeacherId: Number(data.TeacherId || data.teacherId),
      TeacherName: data.TeacherName || data.teacherName,
      CategoriesJson: base.categories || []
    };

    try {
      setLoading(true); // Set loading for this specific action
      setSubjectsError(null);
      const response = await subjectService.createSubject(newSub); 
      // FIX: Apply normalization to the newly created subject
      const normalizedSubject = normalizeSubject(response);
      
      setSubjects(prev => [...prev, normalizedSubject]);
      const teacherId = data.TeacherId || data.teacherId || normalizedSubject.teacherId;
      if (teacherId) {
        setUsers(prev => prev.map(user => {
          if (user.id !== teacherId) return user;
          return { ...user, assignedSubjectIds: [...(user.assignedSubjectIds || []), normalizedSubject.id] };
        }));
      }
    } catch (err) {
      console.error('Failed to add subject:', err);
      setSubjectsError(err.message);
      throw err;
    } finally {
      setLoading(false); // Reset loading
    }
  };

  const deleteSubject = async (id) => {
    const sub = subjects.find(s => s.id === id);
    try {
      setLoading(true); // Set loading for this specific action
      setSubjectsError(null);
      await subjectService.deleteSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      if (sub?.teacherId) {
        setUsers(prev => prev.map(u => u.id === sub.teacherId 
          ? { ...u, assignedSubjectIds: (u.assignedSubjectIds || []).filter(sid => sid !== id) } 
          : u));
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
      setSubjectsError(err.message);
      throw err;
    } finally {
      setLoading(false); // Reset loading
    }
  };

  const updateSubject = async (id, data) => {
    const old = subjects.find(s => s.id === id);
    try {
      setLoading(true); // Set loading for this specific action
      setSubjectsError(null);
      
      // Map data to backend DTO
      const payload = {
        Name: data.name || data.Name || old.name,
        Code: data.code || data.Code || old.code,
        GradeLevel: data.gradeLevel || data.GradeLevel || old.gradeLevel,
        TeacherId: data.teacherId || data.TeacherId || old.teacherId,
        TeacherName: data.teacherName || data.TeacherName || old.teacherName,
        CategoriesJson: data.categories || data.CategoriesJson || old.categories
      };

      const updatedSubject = await subjectService.updateSubject(id, payload);
      
      // Apply normalization to the updated subject response to ensure camelCase consistency
      const normalized = normalizeSubject(updatedSubject);
      setSubjects(prev => prev.map(s => String(s.id) === String(id) ? normalized : s));
      const teacherId = data.TeacherId || data.teacherId;
      if (teacherId) {
        setUsers(prev => prev.map(u => {
          let sids = new Set(u.assignedSubjectIds || []);
          if (String(u.id) === String(teacherId)) sids.add(normalized.id);
          else if (String(u.id) === String(old?.teacherId || old?.TeacherId)) sids.delete(normalized.id);
          return { ...u, assignedSubjectIds: Array.from(sids) };
        }));
      }
    } catch (err) {
      console.error('Failed to update subject:', err);
      setSubjectsError(err.message);
      throw err;
    } finally {
      setLoading(false); // Reset loading
    }
  };

  return { 
    subjects, 
    setSubjects, 
    baseSubjects, 
    setBaseSubjects,
    syncSubjects, // Pass the stable syncSubjects function
    subjectsLoading, 
    subjectsError,
    loading, // Expose general loading state
    createBaseSubject, 
    updateBaseSubject, 
    deleteBaseSubject, 
    addSubject, 
    deleteSubject, 
    updateSubject 
  };
}
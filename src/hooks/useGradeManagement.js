import { useState, useCallback, useEffect } from 'react';
import { useAuthManagement } from './useAuthManagement';
import { useGradingStandards } from './grading/useGradingStandards';
import authService from '../services/authService';
import { useSectionManagement } from './grading/useSectionManagement';
import { useSubjectManagement } from './grading/useSubjectManagement';
import { useSubmissionManagement } from './grading/useSubmissionManagement';
import { useStudentGrades } from './grading/useStudentGrades';

export function useGradeManagement(currentUser) {
  // Centralized State Composition
  const authState = useAuthManagement(currentUser); // Pass currentUser
  const standardsState = useGradingStandards(currentUser);
  const subjectsState = useSubjectManagement(authState.users, authState.setUsers);

  const sectionsState = useSectionManagement(
    authState.users, 
    authState.setUsers, 
    authState.registrations,
    authState.setRegistrations,
    currentUser
  );

  const submissionsState = useSubmissionManagement(subjectsState.subjects, sectionsState.sections);
  const gradingState = useStudentGrades(
    subjectsState.subjects, 
    subjectsState.setSubjects, 
    subjectsState.setBaseSubjects,
    currentUser
  );

  // Centralized refreshers for UI triggers
  const refreshGlobalData = useCallback(async () => {
    await Promise.all([
      authState.syncAuthData?.(),
      sectionsState.syncSections?.(),
      subjectsState.syncSubjects?.(),
      gradingState.syncStudents?.(),
      submissionsState.syncSubmissions?.(),
      standardsState.syncStandards?.()
    ]);
  }, [
    authState.syncAuthData, 
    sectionsState.syncSections, 
    subjectsState.syncSubjects, 
    gradingState.syncStudents,
    submissionsState.syncSubmissions,
    standardsState.syncStandards
  ]);

  const deleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This will unassign them from all classes and subjects.')) {
      try {
        // NEW: Call the API to delete the user from the database
        await authService.deleteProfile(id);

        // Update local state only after successful API deletion
        authState.setUsers(prev => prev.filter(u => u.id !== id));
        // Cleanup references in sections
        sectionsState.setSections(prev => prev.map(sec => sec.adviserId === id ? { ...sec, adviserId: '' } : sec));
        // Cleanup references in subjects
        subjectsState.setSubjects(prev => prev.map(sub => sub.teacherId === id 
          ? { ...sub, teacherId: '', teacherName: 'Unassigned' } 
          : sub
        ));
      } catch (error) {
        alert(`Delete failed: ${error}`);
      }
    }
  };

  // Aggregate errors from critical sync hooks to detect API connectivity issues
  const syncError = 
    authState.error || 
    sectionsState.error || 
    subjectsState.subjectsError || // Use subjectsError from useSubjectManagement
    standardsState.error || 
    gradingState.error ||
    submissionsState.error;

  return { 
    // Auth State
    users: authState.users,
    registrations: authState.registrations,
    registerUser: authState.registerUser,
    updateUser: authState.updateUser,
    syncAuthData: authState.syncAuthData,
    deleteUser,
    rejectRegistration: authState.rejectRegistration,

    // Standards
    transmutationTable: standardsState.transmutationTable,
    syncStandards: standardsState.syncStandards,
    standardsLoading: standardsState.loading,
    setTransmutationTable: standardsState.setTransmutationTable,
    addTransmutation: standardsState.addTransmutation,
    updateTransmutation: standardsState.updateTransmutation,
    deleteTransmutation: standardsState.deleteTransmutation,
    descriptors: standardsState.descriptors,
    setDescriptors: standardsState.setDescriptors,
    deleteDescriptor: standardsState.deleteDescriptor,

    // Sections
    sections: sectionsState.sections || [],
    createSection: sectionsState.createSection,
    updateSection: sectionsState.updateSection,
    deleteSection: sectionsState.deleteSection,
    assignAdviser: sectionsState.assignAdviser,
    syncSections: sectionsState.syncSections || (() => {}),
    approveRegistration: sectionsState.approveRegistration,

    // Subjects
    subjects: subjectsState.subjects || [],
    baseSubjects: subjectsState.baseSubjects || [],
    syncSubjects: subjectsState.syncSubjects,
    createBaseSubject: subjectsState.createBaseSubject,
    updateBaseSubject: subjectsState.updateBaseSubject,
    deleteBaseSubject: subjectsState.deleteBaseSubject,
    addSubject: subjectsState.addSubject,
    updateSubject: subjectsState.updateSubject,
    deleteSubject: subjectsState.deleteSubject,

    // Submissions
    savedClassRecords: submissionsState.savedClassRecords,
    classRecordLogs: submissionsState.classRecordLogs,
    syncSubmissions: submissionsState.syncSubmissions,
    submitClassRecord: submissionsState.submitClassRecord,
    saveDraftClassRecord: submissionsState.saveDraftClassRecord,
    loadClassRecordDraft: submissionsState.loadClassRecordDraft,
    requestEditClassRecord: submissionsState.requestEditClassRecord,
    approveEditRequest: submissionsState.approveEditRequest,
    rejectEditRequest: submissionsState.rejectEditRequest,
    lockClassRecord: submissionsState.lockClassRecord,

    // Grading/Students
    students: gradingState.students || [],
    syncStudents: gradingState.syncStudents,
    setStudents: gradingState.setStudents,
    applyClassRecordDraft: gradingState.applyClassRecordDraft,
    updateGrade: gradingState.updateGrade,
    updateCategoryTitle: gradingState.updateCategoryTitle,
    updateCategoryWeight: gradingState.updateCategoryWeight,
    updateColumnName: gradingState.updateColumnName,
    addCategory: gradingState.addCategory,
    removeCategory: gradingState.removeCategory,
    addColumnToCategory: gradingState.addColumnToCategory,
    removeColumnFromCategory: gradingState.removeColumnFromCategory,
    resetSubjectTemplate: gradingState.resetSubjectTemplate,
    addStudent: gradingState.addStudentToSection, // Renamed for clarity
    removeStudent: gradingState.removeStudent,
    assignStudentToSection: gradingState.assignStudentToSection,
    updateStudent: gradingState.updateStudent, // Expose updateStudent
    enrollStudentOverall: gradingState.enrollStudentOverall, // New overall enrollment
    bulkEnrollStudents: gradingState.bulkEnrollStudents,
    addComponentToSubject: gradingState.addComponentToSubject,
    removeComponentFromSubject: gradingState.removeComponentFromSubject,
    updateComponentName: gradingState.updateComponentName,
    convertToComposite: gradingState.convertToComposite,
    convertToNonComposite: gradingState.convertToNonComposite,

    // Error state
    syncError,
    refreshGlobalData
  };
}
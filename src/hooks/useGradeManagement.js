import { useState, useEffect } from 'react';
import { useAuthManagement } from './useAuthManagement';
import { useGradingStandards } from './grading/useGradingStandards';
import { useSectionManagement } from './grading/useSectionManagement';
import { useSubjectManagement } from './grading/useSubjectManagement';
import { useSubmissionManagement } from './grading/useSubmissionManagement';
import { useStudentGrades } from './grading/useStudentGrades';

export function useGradeManagement() {
  // Centralized State Composition
  const authState = useAuthManagement();
  const standardsState = useGradingStandards();
  const subjectsState = useSubjectManagement(authState.users, authState.setUsers);

  const sectionsState = useSectionManagement(
    authState.users, 
    authState.setUsers, 
    authState.registrations,
    authState.setRegistrations
  );

  const submissionsState = useSubmissionManagement();
  const gradingState = useStudentGrades(
    subjectsState.subjects, 
    subjectsState.setSubjects, 
    subjectsState.setBaseSubjects
  );

  const deleteUser = (id) => {
    if (window.confirm('Are you sure you want to delete this user? This will unassign them from all classes and subjects.')) {
      authState.setUsers(prev => prev.filter(u => u.id !== id));
      // Cleanup references in sections
      sectionsState.setSections(prev => prev.map(sec => sec.adviserId === id ? { ...sec, adviserId: '' } : sec));
      // Cleanup references in subjects
      subjectsState.setSubjects(prev => prev.map(sub => sub.teacherId === id 
        ? { ...sub, teacherId: '', teacherName: 'Unassigned' } 
        : sub
      ));
    }
  };

  return { 
    // Auth State
    users: authState.users,
    registrations: authState.registrations,
    registerUser: authState.registerUser,
    updateUser: authState.updateUser,
    deleteUser,
    rejectRegistration: authState.rejectRegistration,

    // Standards
    transmutationTable: standardsState.transmutationTable,
    setTransmutationTable: standardsState.setTransmutationTable,
    descriptors: standardsState.descriptors,
    setDescriptors: standardsState.setDescriptors,

    // Sections
    sections: sectionsState.sections || [],
    createSection: sectionsState.createSection,
    updateSection: sectionsState.updateSection,
    deleteSection: sectionsState.deleteSection,
    assignAdviser: sectionsState.assignAdviser,
    approveRegistration: sectionsState.approveRegistration,

    // Subjects
    subjects: subjectsState.subjects || [],
    baseSubjects: subjectsState.baseSubjects || [],
    createBaseSubject: subjectsState.createBaseSubject,
    updateBaseSubject: subjectsState.updateBaseSubject,
    deleteBaseSubject: subjectsState.deleteBaseSubject,
    addSubject: subjectsState.addSubject,
    updateSubject: subjectsState.updateSubject,
    deleteSubject: subjectsState.deleteSubject,

    // Submissions
    savedClassRecords: submissionsState.savedClassRecords,
    classRecordLogs: submissionsState.classRecordLogs,
    submitClassRecord: submissionsState.submitClassRecord,
    requestEditClassRecord: submissionsState.requestEditClassRecord,
    approveEditRequest: submissionsState.approveEditRequest,
    rejectEditRequest: submissionsState.rejectEditRequest,
    lockClassRecord: submissionsState.lockClassRecord,

    // Grading/Students
    students: gradingState.students || [],
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
  };
}
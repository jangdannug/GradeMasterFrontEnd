import { useState, useEffect } from 'react';
import classRecordService from '../../services/classRecordService';
export function useSubmissionManagement() {
  const [savedClassRecords, setSavedClassRecords] = useState([]);
  const [classRecordLogs, setClassRecordLogs] = useState([]);

  const submitClassRecord = ({ subject, section, teacher, students, quarter }) => {
    const now = new Date().toISOString();
    const recordId = `${section.id}-${subject.id}-Q${quarter}`;
    
    // Validation: Prevent re-submission if the quarter's record is already verified
    const existingVerifiedRecord = savedClassRecords.find(r => r.id === recordId && r.isVerified);
    if (existingVerifiedRecord) {
      return { success: false, message: `Quarter ${quarter} for ${subject.name} has already been verified and cannot be resubmitted.` };
    }

    const savedRecord = {
      id: recordId,
      sectionId: section.id,
      sectionName: section.name,
      gradeLevel: section.gradeLevel,
      subjectId: subject.id,
      subjectName: subject.name,
      quarter: quarter,
      submittedAt: now,
      isLocked: true,
      isVerified: false,
      teacherId: teacher.id,
      teacherName: teacher.name,
      studentSnapshots: students.map(s => ({ ...s, grades: s.grades[subject.id]?.[quarter] || null }))
    };

    setSavedClassRecords(prev => [savedRecord, ...prev.filter(r => r.id !== recordId)]);
    setClassRecordLogs(prev => {
      // Ensure any lingering pending requests are resolved upon submission
      const updatedLogs = prev.map(log => 
        (log.recordId === recordId && log.action === 'edit_requested' && log.status === 'pending')
          ? { ...log, status: 'resolved' }
          : log
      );
      return [{
        id: `log-${Date.now()}`,
        recordId,
        action: 'submitted',
        submittedBy: teacher.name,
        submittedAt: now
      }, ...updatedLogs];
    });

    return { success: true, message: 'Class record submitted successfully.' };
  };

  const requestEditClassRecord = (recordId, teacherId, teacherName, reason) => {
    setClassRecordLogs(prev => [{
      id: `log-${Date.now()}`,
      recordId,
      action: 'edit_requested',
      requestedBy: teacherName,
      requestedAt: new Date().toISOString(),
      reason,
      status: 'pending'
    }, ...prev]);
  };

  const approveEditRequest = (recordId, adviserId, adviserName, reason) => {
    setSavedClassRecords(prev => prev.map(r => r.id === recordId ? { ...r, isLocked: false } : r));
    setClassRecordLogs(prev => {
      // Update the status of the specific pending request to 'approved'
      const updatedLogs = prev.map(log => 
        (log.recordId === recordId && log.action === 'edit_requested' && log.status === 'pending')
          ? { ...log, status: 'approved' }
          : log
      );
      return [{
        id: `log-${Date.now()}`,
        recordId,
        action: 'edit_approved',
        approvedBy: adviserName,
        approvedAt: new Date().toISOString(),
        reason,
        status: 'approved'
      }, ...updatedLogs];
    });
  };

  const rejectEditRequest = (recordId, adviserId, adviserName, reason) => {
    setClassRecordLogs(prev => {
      // Update the status of the specific pending request to 'rejected'
      const updatedLogs = prev.map(log => 
        (log.recordId === recordId && log.action === 'edit_requested' && log.status === 'pending')
          ? { ...log, status: 'rejected' }
          : log
      );
      return [{
        id: `log-${Date.now()}`,
        recordId,
        action: 'edit_rejected',
        rejectedBy: adviserName,
        rejectedAt: new Date().toISOString(),
        reason,
        status: 'rejected'
      }, ...updatedLogs];
    });
  };

  const lockClassRecord = (recordId, adviserId, adviserName) => {
    setSavedClassRecords(prev => prev.map(r => r.id === recordId ? { ...r, isLocked: true, isVerified: true } : r));
    setClassRecordLogs(prev => [{
      id: `log-${Date.now()}`,
      recordId, action: 'locked', lockedBy: adviserName, lockedAt: new Date().toISOString()
    }, ...prev]);
  };

  return { savedClassRecords, classRecordLogs, submitClassRecord, requestEditClassRecord, approveEditRequest, rejectEditRequest, lockClassRecord };
}
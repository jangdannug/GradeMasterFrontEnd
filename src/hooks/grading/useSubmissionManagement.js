import { useState, useEffect } from 'react';
import classRecordService from '../../services/classRecordService';

export function useSubmissionManagement() {
  const [savedClassRecords, setSavedClassRecords] = useState([]);
  const [classRecordLogs, setClassRecordLogs] = useState([]);
  const [error, setError] = useState(null);

  // Helper to normalize PascalCase keys from C# to camelCase for the frontend
  const normalize = (data) => {
    if (!data) return data;
    const transform = (obj) => Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k.charAt(0).toLowerCase() + k.slice(1), v])
    );
    return Array.isArray(data) ? data.map(transform) : transform(data);
  };

  const syncSubmissions = async () => {
    setError(null);
    try {
      const records = await classRecordService.getClassRecords();
      setSavedClassRecords(normalize(records));
      // Assuming a separate endpoint for all logs or fetching logs per record
      // For now, we'll just fetch records. Logs will be fetched per record as needed.
    } catch (err) {
      console.error("Failed to fetch class records or logs:", err);
      setError(err);
      throw err;
    }
  };

  const submitClassRecord = async ({ subject, section, teacher, students, quarter }) => {
    const now = new Date().toISOString();
    const recordId = `${section.id}-${subject.id}-Q${quarter}`;
    
    // Validation: Prevent re-submission if the quarter's record is already verified
    const existingVerifiedRecord = savedClassRecords.find(r => r.id === recordId && r.isVerified);
    if (existingVerifiedRecord) {
      return { success: false, message: `Quarter ${quarter} for ${subject.name} has already been verified and cannot be resubmitted.` };
    }

    const newRecordData = {
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
    
    try {
      setError(null);
      const submittedRecord = await classRecordService.submitClassRecord(newRecordData);
      setSavedClassRecords(prev => [normalize(submittedRecord), ...prev.filter(r => r.id !== recordId)]);
      
      // Log the submission
      const logEntry = {
        recordId: submittedRecord.id,
        action: 'submitted',
        actorName: teacher.name,
        status: 'resolved' // Assuming submission is a resolved action
      };
      // Assuming classRecordService.createLog or similar exists
      // await classRecordService.createLog(logEntry); 
      setClassRecordLogs(prev => [normalize(logEntry), ...prev]);

      return { success: true, message: 'Class record submitted successfully.' };
    } catch (error) {
      console.error("Error submitting class record:", error);
      setError(error);
      return { success: false, message: error.message || 'Failed to submit class record.' };
    }
  };

  const requestEditClassRecord = async (recordId, teacherId, teacherName, reason) => {
    try {
      setError(null);
      const log = await classRecordService.requestEditClassRecord(recordId, teacherId, teacherName, reason);
      setClassRecordLogs(prev => [normalize(log), ...prev]);
    } catch (err) {
      console.error("Failed to request edit:", err);
      setError(err);
      throw err;
    }
  };

  const approveEditRequest = async (recordId, adviserId, adviserName, reason) => {
    try {
      // Unlock the record
      setError(null);
      await classRecordService.lockClassRecord(recordId, false);
      setSavedClassRecords(prev => prev.map(r => r.id === recordId ? { ...r, isLocked: false } : r));

      // Log the approval
      const log = await classRecordService.approveEditRequest(recordId, adviserId, adviserName, reason);
      setClassRecordLogs(prev => [normalize(log), ...prev.map(l => 
        (l.recordId === recordId && l.action === 'edit_requested' && l.status === 'pending')
          ? { ...l, status: 'approved' } : l
      )]);
    } catch (err) {
      console.error("Failed to approve edit request:", err);
      setError(err);
      throw err;
    }
  };

  const rejectEditRequest = async (recordId, adviserId, adviserName, reason) => {
    try {
      const log = await classRecordService.rejectEditRequest(recordId, adviserId, adviserName, reason);
      setError(null);
      setClassRecordLogs(prev => [normalize(log), ...prev.map(l => 
        (l.recordId === recordId && l.action === 'edit_requested' && l.status === 'pending')
          ? { ...l, status: 'rejected' } : l
      )]);
    } catch (err) {
      console.error("Failed to reject edit request:", err);
      setError(err);
      throw err;
    }
  };

  const lockClassRecord = async (recordId, adviserId, adviserName) => {
    try {
      await classRecordService.lockClassRecord(recordId, true); // Lock the record
      setError(null);
      // Assuming verification also happens on lock
      await classRecordService.verifyClassRecord(recordId, true);

      setSavedClassRecords(prev => prev.map(r => r.id === recordId ? { ...r, isLocked: true, isVerified: true } : r));
      
      const logEntry = {
        recordId,
        action: 'locked',
        actorName: adviserName,
        status: 'resolved'
      };
      // Assuming classRecordService.createLog or similar exists
      // await classRecordService.createLog(logEntry);
      setClassRecordLogs(prev => [normalize(logEntry), ...prev]);
    } catch (err) {
      console.error("Failed to lock class record:", err);
      setError(err);
      throw err;
    }
  };

  return { savedClassRecords, classRecordLogs, syncSubmissions, submitClassRecord, requestEditClassRecord, approveEditRequest, rejectEditRequest, lockClassRecord, error };
}
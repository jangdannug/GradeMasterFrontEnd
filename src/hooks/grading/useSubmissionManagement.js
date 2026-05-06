import { useState, useCallback, useMemo } from 'react';
import classRecordService from '../../services/classRecordService';

const normalize = (data) => {
  if (!data) return data;
  const transform = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const normalized = Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k.charAt(0).toLowerCase() + k.slice(1), v])
    );

    // Ensure 'id' for frontend state is the composite key (for lookups), 
    // and keep the database primary key as 'dbId' (for API calls).
    if (normalized.uniqueRecordKey) {
      normalized.dbId = normalized.id;
      normalized.id = normalized.uniqueRecordKey;
    }

    // Handle studentSnapshotsJson if it's returned as a string from the API
    if (normalized.studentSnapshotsJson && typeof normalized.studentSnapshotsJson === 'string') {
      try {
        normalized.studentSnapshots = JSON.parse(normalized.studentSnapshotsJson);
        delete normalized.studentSnapshotsJson; // Remove the original string property
      } catch (e) {
        console.error("Failed to parse studentSnapshotsJson:", e);
        normalized.studentSnapshots = [];
      }
    }
    // Deep normalize student snapshots if they exist
    if (normalized.studentSnapshots && Array.isArray(normalized.studentSnapshots)) {
      normalized.studentSnapshots = normalized.studentSnapshots.map(s => ({
        ...s,
        id: s.id || s.Id,
        grades: (typeof (s.grades || s.Grades || s.gradesJson || s.GradesJson) === 'string' 
          ? JSON.parse(s.grades || s.Grades || s.gradesJson || s.GradesJson) 
          : (s.grades || s.Grades || s.gradesJson || s.GradesJson)) || {}
      }));
    }
    return normalized;
  };
  return Array.isArray(data) ? data.map(transform) : transform(data);
};

export function useSubmissionManagement(allSubjects, allSections) { // allSubjects and allSections are passed from useGradeManagement
  const [rawRecords, setRawRecords] = useState([]);
  const [classRecordLogs, setClassRecordLogs] = useState([]);
  const [error, setError] = useState(null);

  const syncSubmissions = useCallback(async () => {
    setError(null);
    try {
      const records = await classRecordService.getClassRecords();
      setRawRecords(normalize(records));
    } catch (err) {
      console.error("Failed to fetch class records or logs:", err);
      setError(err);
      throw err;
    }
  }, []); // This function is now stable and won't trigger re-fetch loops

  // Derived state: Enrich raw database records with subject/section metadata for the UI
  const savedClassRecords = useMemo(() => {
    return rawRecords.map(record => {
      // Lookup metadata from the stable lists provided by the parent
      const subject = allSubjects.find(s => String(s.id) === String(record.subjectId)); 
      const section = allSections.find(s => String(s.id) === String(record.sectionId)); 
      return {
        ...record,
        subjectName: subject?.name || 'Unknown Subject',
        gradeLevel: section?.gradeLevel || 'Unknown Grade',
        sectionName: section?.name || 'Unknown Section',
      };
    });
  }, [rawRecords, allSubjects, allSections]);

  const saveDraftClassRecord = useCallback(async ({ subject, section, teacher, students, quarter }) => {
    const recordId = `${section.id}-${subject.id}-Q${quarter}`;
    const draftData = {
      Id: String(recordId), // This is the text unique key (e.g. 5-2-Q1)
      SectionId: String(section.id), // String is safer for both int and Guid DTOs
      SectionName: section.name || '',
      GradeLevel: section.gradeLevel || '',
      SubjectId: String(subject.id),
      SubjectName: subject.name || '',
      Quarter: quarter,
      UpdatedAt: new Date().toISOString(),
      IsLocked: false,
      IsDraft: true,
      TeacherId: String(teacher.id),
      TeacherName: teacher.name || '',
      StudentSnapshots: students.map(s => ({
        Id: String(s.id),
        Name: s.name || '',
        Gender: s.gender || '',
        GradeLevel: s.gradeLevel || '',
        SchoolYear: s.schoolYear || '',
        SectionId: s.sectionId ? String(s.sectionId) : null,
        Grades: s.grades?.[subject.id]?.[quarter] || {} // Send as raw object for JsonDocument
      }))
    };

    try {
      setError(null);
      const savedDraft = await classRecordService.saveClassRecordDraft(recordId, draftData);
      setRawRecords(prev => [normalize(savedDraft), ...prev.filter(r => r.id !== recordId)]);
      return { success: true, message: 'Draft saved successfully.' };
    } catch (error) {
      console.error('Error saving draft class record:', error);
      setError(error);
      return { success: false, message: error.message || 'Failed to save draft class record.' };
    }
  }, []);

  const loadClassRecordDraft = useCallback(async (recordId) => {
    try {
      setError(null);
      
      // Robust parsing for "sectionId-subjectId-Qquarter" (handles dashes in UUIDs)
      const parts = recordId.split('-Q');
      const quarter = parts[1];
      const ids = parts[0].split('-');
      
      // The last element before -Q is always the subjectId
      const subjectId = ids.pop();
      // Everything else before that is the sectionId (handles UUIDs correctly)
      const sectionId = ids.join('-');

      const draftRecord = await classRecordService.getClassRecordByCompositeKey({
        sectionId: String(sectionId),
        subjectId: String(subjectId),
        quarter: Number(quarter)
      });
      return normalize(draftRecord);
    } catch (error) {
      if (error.response?.status === 404 || error.message?.includes('Failed to fetch class record')) {
        return null;
      }
      console.error('Failed to load class record draft:', error);
      setError(error);
      return null;
    }
  }, []);

  const submitClassRecord = useCallback(async ({ subject, section, teacher, students, quarter }) => {
    const recordId = `${section.id}-${subject.id}-Q${quarter}`;

    // Validation: Prevent re-submission if the quarter's record is already verified
    const existing = savedClassRecords.find(r => r.id === recordId);
    
    if (existing && existing.isVerified) {
      return { success: false, message: `Quarter ${quarter} for ${subject.name} has already been verified and cannot be resubmitted.` };
    }

    if (!existing || !existing.dbId) {
      return { success: false, message: "No draft found. Please save your changes as a draft before submitting." };
    }
    
    try {
      setError(null);
      // Call the lock endpoint as requested: PUT /api/classrecord/{id}/lock
      const submittedRecord = await classRecordService.lockClassRecord(existing.dbId, true);
      
      setRawRecords(prev => [normalize(submittedRecord), ...prev.filter(r => r.id !== recordId)]);
      
      // Log the submission locally for UI consistency
      const logEntry = {
        recordId: existing.dbId,
        action: 'submitted',
        actorName: teacher.name,
        status: 'resolved',
        createdAt: new Date().toISOString()
      };
      setClassRecordLogs(prev => [normalize(logEntry), ...prev]);

      return { success: true, message: 'Class record submitted successfully.' };
    } catch (error) {
      console.error("Error submitting class record:", error);
      setError(error);
      return { success: false, message: error.message || 'Failed to submit class record.' };
    }
  }, [savedClassRecords]);

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
      setRawRecords(prev => prev.map(r => r.id === recordId ? { ...r, isLocked: false } : r));

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

      setRawRecords(prev => prev.map(r => r.id === recordId ? { ...r, isLocked: true, isVerified: true } : r));
      
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

  return { savedClassRecords, classRecordLogs, syncSubmissions, saveDraftClassRecord, loadClassRecordDraft, submitClassRecord, requestEditClassRecord, approveEditRequest, rejectEditRequest, lockClassRecord, error };
}
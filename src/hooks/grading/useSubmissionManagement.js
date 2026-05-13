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

    // Handle lockedComponentIdsJson
    if (normalized.lockedComponentIdsJson && typeof normalized.lockedComponentIdsJson === 'string') {
      try {
        normalized.lockedComponentIds = JSON.parse(normalized.lockedComponentIdsJson);
      } catch (e) {
        normalized.lockedComponentIds = [];
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
      const normalizedRecords = normalize(records);
      setRawRecords(normalizedRecords);

      // Fetch logs for all records to ensure advisers see pending edit requests
      const logsPromises = normalizedRecords.map(r => 
        classRecordService.getClassRecordLogs(r.dbId || r.id).catch(() => [])
      );
      const allLogs = await Promise.all(logsPromises);
      setClassRecordLogs(normalize(allLogs.flat()));
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

  const saveDraftClassRecord = useCallback(async (data) => {
    const { subject, section, teacher, students, quarter, lockedComponentIds } = data;
    const recordId = `${section.id}-${subject.id}-Q${quarter}`;
    
    // Find existing to preserve metadata or dbId if available
    const existing = rawRecords.find(r => r.id === recordId);
    const finalLockedIds = lockedComponentIds || existing?.lockedComponentIds || [];

    const draftData = {
      Id: recordId, // This is the composite key (e.g., "5-3-Q1")
      SectionId: String(section.id), // Change from int to string
      SectionName: section.name || '',
      GradeLevel: section.gradeLevel || '',
      SubjectId: String(subject.id), // Change from int to string
      SubjectName: subject.name || '',
      Quarter: quarter,
      UpdatedAt: new Date().toISOString(),
      IsLocked: false,
      IsDraft: true,
      TeacherId: String(teacher.id), // Change from int to string
      TeacherName: teacher.name || '',
      StudentSnapshots: students.map(s => ({ // List<StudentSnapshotDto>
        Id: String(s.id), // Change from int to string
        Name: s.name || '',
        Gender: s.gender || '',
        GradeLevel: s.gradeLevel || '',
        SchoolYear: s.schoolYear || '',
        Birthdate: s.birthdate || '',
        Address: s.address || '',
        MotherTongue: s.motherTongue || '',
        Religion: s.religion || '',
        EthnicGroup: s.ethnicGroup || '',
        HasDisability: s.hasDisability || false,
        SectionId: s.sectionId ? String(s.sectionId) : null, // Change from int? to string?
        Grades: s.grades?.[subject.id]?.[quarter] || {} // JsonDocument, so send as object
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
  }, [rawRecords]);

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

  const submitClassRecord = useCallback(async (submitData) => {
    const { subject, section, teacher, students, quarter, activeComponentId } = submitData;
    const recordId = `${section.id}-${subject.id}-Q${quarter}`;

    // Step 1: Ensure the latest state is saved as a draft
    const saveResult = await saveDraftClassRecord(submitData);
    if (!saveResult.success) {
      return { success: false, message: saveResult.message || 'Failed to save latest draft before submission.' };
    }

    // Step 2: Find the record
    let existing = savedClassRecords.find(r => r.id === recordId);
    
    if (existing && existing.isVerified) {
      return { success: false, message: `Quarter ${quarter} for ${subject.name} has already been verified and cannot be resubmitted.` };
    }

    if (!existing || (!existing.dbId && existing.id !== recordId)) {
      return { success: false, message: "No draft found. Please save your changes as a draft before submitting." };
    }
    
    try { 
      setError(null);

      const isMainTeacher = String(subject.teacherId) === String(teacher.id);

      if (!isMainTeacher && activeComponentId) {
        // Component Lock: Add to LockedComponentIdsJson via draft update
        const lockedComponentIds = [...(existing.lockedComponentIds || []), activeComponentId];
        const result = await saveDraftClassRecord({ ...submitData, lockedComponentIds });
        if (!result.success) return result;
      } else {
        // Global Lock: Use the API lock endpoint
        const submittedRecord = await classRecordService.lockClassRecord(existing.dbId, true);
        setRawRecords(prev => [normalize(submittedRecord), ...prev.filter(r => r.id !== recordId)]);
      }
      
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
  }, [savedClassRecords, saveDraftClassRecord]);

  const requestEditClassRecord = useCallback(async (recordId, teacherId, teacherName, reason) => {
    const existing = savedClassRecords.find(r => r.id === recordId);
    if (!existing || !existing.dbId) return;

    try {
      setError(null);
      await classRecordService.requestEditClassRecord(existing.dbId, teacherId, teacherName, reason);
      
      // Manually add the log entry so the UI reflects "Edit Request Pending" immediately
      const newLog = {
        recordId: existing.dbId,
        action: 'edit_requested',
        status: 'pending',
        reason: reason,
        actorName: teacherName,
        createdAt: new Date().toISOString()
      };
      setClassRecordLogs(prev => [normalize(newLog), ...prev]);
      return { success: true };
    } catch (err) {
      console.error("Failed to request edit:", err);
      setError(err);
      return { success: false, message: err };
    }
  }, [savedClassRecords]);

  const approveEditRequest = useCallback(async (recordId, adviserId, adviserName, reason) => {
    const existing = savedClassRecords.find(r => r.id === recordId);
    if (!existing || !existing.dbId) return;

    try {
      setError(null);
      // Use the specific approve endpoint which handles both unlocking and logging
      const updatedRecord = await classRecordService.approveEditRequest(existing.dbId, adviserId, adviserName, reason);
      
      // Update record status in UI
      setRawRecords(prev => prev.map(r => r.id === recordId ? { ...r, isLocked: false } : r));
      
      // Update logs: Mark the pending request as approved
      setClassRecordLogs(prev => {
        const approvedLog = {
          recordId: existing.dbId,
          action: 'edit_approved',
          status: 'approved',
          reason: reason,
          actorName: adviserName,
          createdAt: new Date().toISOString()
        };
        return [normalize(approvedLog), ...prev.map(l => 
          (l.recordId === existing.dbId && l.action === 'edit_requested' && l.status === 'pending')
            ? { ...l, status: 'approved' } : l
        )];
      });
    } catch (err) {
      console.error("Failed to approve edit request:", err);
      setError(err);
    }
  }, [savedClassRecords]);

  const rejectEditRequest = useCallback(async (recordId, adviserId, adviserName, reason) => {
    const existing = savedClassRecords.find(r => r.id === recordId);
    if (!existing || !existing.dbId) return;

    try {
      setError(null);
      await classRecordService.rejectEditRequest(existing.dbId, adviserId, adviserName, reason);
      
      setClassRecordLogs(prev => {
        const rejectedLog = {
          recordId: existing.dbId,
          action: 'edit_rejected',
          status: 'rejected',
          reason: reason,
          actorName: adviserName,
          createdAt: new Date().toISOString()
        };
        return [normalize(rejectedLog), ...prev.map(l => 
          (l.recordId === existing.dbId && l.action === 'edit_requested' && l.status === 'pending')
            ? { ...l, status: 'rejected' } : l
        )];
      });
    } catch (err) {
      console.error("Failed to reject edit request:", err);
      setError(err);
      throw err;
    }
  }, [savedClassRecords]);

  const lockClassRecord = async (recordId, adviserId, adviserName) => {
    const existing = savedClassRecords.find(r => r.id === recordId);
    if (!existing || !existing.dbId) return;

    try {
      setError(null);
      // Use the verify endpoint which we updated to also lock the record
      await classRecordService.verifyClassRecord(existing.dbId, true, 'Verified by Adviser');

      setRawRecords(prev => prev.map(r => r.id === recordId ? { ...r, isLocked: true, isVerified: true } : r));
      
      const logEntry = {
        recordId: existing.dbId,
        action: 'verified',
        actorName: adviserName,
        status: 'resolved',
        createdAt: new Date().toISOString()
      };
      setClassRecordLogs(prev => [normalize(logEntry), ...prev]);
    } catch (err) {
      console.error("Failed to lock class record:", err);
      setError(err);
      throw err;
    }
  };

  return { savedClassRecords, classRecordLogs, syncSubmissions, saveDraftClassRecord, loadClassRecordDraft, submitClassRecord, requestEditClassRecord, approveEditRequest, rejectEditRequest, lockClassRecord, error };
}
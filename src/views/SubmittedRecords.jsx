import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Eye, MessageSquare, Check, X, FileSearch } from 'lucide-react';
import { theme } from '../theme';

export function SubmittedRecords({
  savedRecords = [],
  classRecordLogs = [],
  userRole = 'teacher',
  currentUserId = '',
  currentUserName = '',
  sections = [],
  onRequestEdit = null,
  onApproveEdit = null,
  onRejectEdit = null,
  onLockRecord = null,
  onSelectSubject = null,
  onSync = null,
  mode = 'submitted', // 'submitted' (pending) | 'verified' (finalized)
  maxQuarters = 4
}) {
  const [expandedRecord, setExpandedRecord] = useState(null);
  const navigate = useNavigate();
  const [editRequestForm, setEditRequestForm] = useState({});
  const [showApprovalForm, setShowApprovalForm] = useState({});
  const [quarterFilter, setQuarterFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Ensure data is fresh when viewing submitted records
  useEffect(() => {
    onSync?.();
  }, [onSync]);

  const adviserSection = React.useMemo(() => 
    sections.find(s => s.adviserId === currentUserId),
    [sections, currentUserId]
  );

  const baseRecords = React.useMemo(() => {
    let filtered = [];
    if (userRole === 'teacher') {
      filtered = savedRecords.filter(record => record.teacherId === currentUserId && record.isLocked);
    } else if (userRole === 'adviser') {
      // Advisers see records for their own advisory section AND records they personally teach in other sections
      filtered = savedRecords.filter(record => 
        (record.sectionId === adviserSection?.id || record.teacherId === currentUserId) && record.isLocked
      );
    }
    
    if (mode === 'verified') return filtered.filter(r => r.isVerified);
    return filtered.filter(r => !r.isVerified);
  }, [savedRecords, userRole, currentUserId, adviserSection, mode]);

  const availableSubjects = React.useMemo(() => {
    const subs = new Set();
    baseRecords.forEach(r => subs.add(r.subjectName));
    return Array.from(subs).sort();
  }, [baseRecords]);

  const filteredRecords = React.useMemo(() => {
    let records = [...baseRecords];
    if (quarterFilter !== 'all') {
      records = records.filter(r => r.quarter === parseInt(quarterFilter));
    }
    if (subjectFilter !== 'all') {
      records = records.filter(r => r.subjectName === subjectFilter);
    }
    return records;
  }, [baseRecords, quarterFilter, subjectFilter]);

  const getRecordLogs = (recordId) => {
    return classRecordLogs
      // Use loose equality or String cast as DB IDs might be numbers while local state might be strings
      .filter(log => String(log.recordId) === String(recordId))
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.submittedAt || a.requestedAt || a.approvedAt || a.rejectedAt || a.lockedAt);
        const timeB = new Date(b.createdAt || b.submittedAt || b.requestedAt || b.approvedAt || b.rejectedAt || b.lockedAt);
        return timeB - timeA;
      });
  };

  const getPendingEditRequest = (recordId) => {
    const logs = getRecordLogs(recordId);
    if (logs.length === 0) return null;
    
    // An edit request is ONLY active if it is the most recent activity.
    // Once an adviser approves/rejects or a teacher resubmits, the request is closed.
    const latestLog = logs[0];
    return (latestLog.action === 'edit_requested' && latestLog.status === 'pending') ? latestLog : null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className={`${theme.styles.card} p-6`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-6 border-b border-slate-100">
          <h2 className="text-3xl font-black uppercase tracking-tighter">
            {mode === 'verified' ? 'Verified Records' : 'Submitted Records'}
          </h2>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
             <div className="flex flex-col gap-1.5 flex-1 sm:flex-none">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">By Quarter</label>
               <select 
                 value={quarterFilter}
                 onChange={(e) => setQuarterFilter(e.target.value)} // Use theme.styles.input
                 className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-black text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all min-w-[140px]"
               >
                 <option key="all-q" value="all">ALL QUARTERS</option>
                 {Array.from({ length: maxQuarters }, (_, i) => i + 1).map(q => <option key={q} value={q}>QUARTER {q}</option>)}
               </select>
             </div>

             <div className="flex flex-col gap-1.5 flex-1 sm:flex-none">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">By Subject</label>
               <select 
                 value={subjectFilter}
                 onChange={(e) => setSubjectFilter(e.target.value)} // Use theme.styles.input
                 className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-black text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all min-w-[200px]"
               >
                 <option key="all-s" value="all">ALL SUBJECTS</option>
                 {availableSubjects.map(sub => (
                   <option key={sub} value={sub}>{sub}</option>
                 ))}
               </select>
             </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? ( // No records message
          <div className="text-center py-12 text-slate-400 bg-white/50 rounded-2xl border border-white/60">
            <p className="font-black uppercase italic tracking-widest">No submitted records matching filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const logs = getRecordLogs(record.dbId || record.id);
              const pendingEdit = getPendingEditRequest(record.dbId || record.id);
              const isExpanded = expandedRecord === record.id;

              return (
                <motion.div
                  key={record.id}
                  className="border border-white/60 rounded-lg overflow-hidden bg-white/50 backdrop-blur-sm"
                >
                  <button
                    onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                    className="w-full p-4 bg-white/50 hover:bg-white/70 flex items-center justify-between transition-colors"
                  > 
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <ChevronDown
                        size={20}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                      <div>
                        <p className="font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-2 flex-wrap">
                          {record.subjectName}
                          <span className="not-italic text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 tracking-widest">
                            {record.teacherName}
                          </span>
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-base text-slate-800 font-black">Q{record.quarter}</p>
                          <span className="text-slate-300 text-xl">•</span>
                          <p className="text-base text-slate-800 font-bold">
                            {record.gradeLevel} - {record.sectionName}
                          </p>
                          <span className="text-slate-300 text-lg">•</span>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-tight italic">Submitted: {new Date(record.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${
                        record.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {record.isVerified ? '✓ VERIFIED' : '⏳ PENDING VERIFICATION'}
                      </span>
                      
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${record.isLocked ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                        {record.isLocked ? '🔒 LOCKED' : '📝 OPEN'}
                      </span>
                      {pendingEdit && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                          ⏳ EDIT REQUEST PENDING
                        </span>
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-200"
                      >
                        <div className="p-6 space-y-6 bg-white/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-base">
                            <div>
                              <p className="text-slate-500 font-bold uppercase text-sm">Teacher</p>
                              <p className="text-slate-800 font-medium">{record.teacherName}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-bold uppercase text-sm">Subject</p>
                              <p className="text-slate-800 font-black uppercase italic text-lg">{record.subjectName}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-bold uppercase text-sm">Grade & Section</p>
                              <p className="text-slate-800 font-bold text-lg">{record.gradeLevel} - {record.sectionName}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-bold uppercase text-sm">Submitted</p>
                              <p className="text-slate-800 font-medium">
                                {new Date(record.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-bold uppercase text-sm">Students</p>
                              <p className="text-slate-800 font-medium">{record.studentSnapshots?.length || 0}</p>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <button
                              onClick={() => {
                                if (onSelectSubject) onSelectSubject(record.subjectId);
                                navigate('/record');
                              }}
                              className="w-full px-4 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-lg transition-colors text-base flex items-center gap-2 justify-center shadow-lg shadow-slate-300"
                            >
                              <FileSearch size={16} />
                              View Detailed Class Record
                            </button>
                          </div>

                          {record.sectionId === adviserSection?.id && !record.isVerified && !pendingEdit && (
                            <div className="border-t pt-4">
                              <button
                                onClick={() => onLockRecord && onLockRecord(record.id, currentUserId, currentUserName)} // Verify/Lock button
                                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-base flex items-center gap-2 justify-center shadow-lg shadow-emerald-100"
                              >
                                <Check size={16} />
                                Verify & Finalize Record
                              </button>
                            </div>
                          )}

                          <div className="border-t pt-4">
                            <h4 className="font-bold uppercase text-sm mb-3">File Log</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {logs.map((log, index) => (
                                <div key={log.id || index} className="text-sm border-l-2 border-slate-200 pl-3 py-2">
                                  <div className="font-bold text-slate-800 capitalize">
                                    {log.action.replace(/_/g, ' ')}
                                  </div>
                                  <div className="text-slate-700">
                                    By: {log.actorName || log.submittedBy || log.requestedBy || log.approvedBy || log.rejectedBy || log.lockedBy || 'System'}
                                  </div>
                                  <div className="text-slate-600">
                                    {new Date(log.createdAt || log.submittedAt || log.requestedAt || log.approvedAt || log.rejectedAt || log.lockedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                  </div>
                                  {log.reason && (
                                    <div className="text-slate-600 mt-1 italic">
                                      Reason: {log.reason}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {record.teacherId === currentUserId && record.isLocked && !record.isVerified && !pendingEdit && (
                            <div className="border-t pt-4">
                              <button
                                onClick={() => setEditRequestForm({ ...editRequestForm, [record.id]: true })}
                                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
                              > 
                                <MessageSquare size={16} />
                                Request Edit
                              </button>
                            </div>
                          )}

                          {editRequestForm[record.id] && (
                            <div className="border-t pt-4">
                              <textarea
                                placeholder="Please provide a reason for editing..."
                                value={editRequestForm[`${record.id}_reason`] || ''}
                                onChange={(e) =>
                                  setEditRequestForm({
                                    ...editRequestForm,
                                    [`${record.id}_reason`]: e.target.value
                                  })
                                }
                                className="w-full p-3 border border-white/60 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white/50"
                                rows={3}
                              />
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => {
                                    setEditRequestForm({
                                      ...editRequestForm,
                                      [record.id]: false,
                                      [`${record.id}_reason`]: ''
                                    });
                                  }}
                                  className="flex-1 px-4 py-3 border border-white/60 text-slate-700 font-bold rounded-lg hover:bg-white/70 transition-colors bg-white/50"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    if (onRequestEdit) {
                                      onRequestEdit(
                                        record.id,
                                        currentUserId,
                                        currentUserName,
                                        editRequestForm[`${record.id}_reason`]
                                      );
                                    }
                                    setEditRequestForm({
                                      ...editRequestForm,
                                      [record.id]: false,
                                      [`${record.id}_reason`]: ''
                                    });
                                  }}
                                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                                >
                                  Send Request
                                </button>
                              </div>
                            </div>
                          )}

                          {record.sectionId === adviserSection?.id && pendingEdit && (
                            <div className="border-t pt-4 bg-orange-50 p-4 rounded-lg">
                              <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                                <MessageSquare size={16} />
                                Edit Request from {pendingEdit.actorName}
                              </h4>
                              <p className="text-sm text-orange-800 mb-3">
                                <span className="font-bold">Reason:</span> {pendingEdit.reason}
                              </p>
                              {!showApprovalForm[record.id] && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setShowApprovalForm({ ...showApprovalForm, [record.id]: true })}
                                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 justify-center"
                                  > 
                                    <Check size={16} />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (onRejectEdit) {
                                        onRejectEdit(record.id, currentUserId, currentUserName, 'Edit request rejected by adviser');
                                      }
                                    }}
                                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 justify-center"
                                  >
                                    <X size={16} />
                                    Reject
                                  </button>
                                </div>
                              )}
                              {showApprovalForm[record.id] && (
                                <div className="space-y-2">
                                  <textarea
                                    placeholder="Provide reason for approval..."
                                    defaultValue=""
                                    onChange={(e) =>
                                      setEditRequestForm({
                                        ...editRequestForm,
                                        [`${record.id}_approval_reason`]: e.target.value
                                      })
                                    }
                                    className="w-full p-3 border border-white/60 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white/50"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setShowApprovalForm({ ...showApprovalForm, [record.id]: false })}
                                      className="flex-1 px-4 py-2 border border-white/60 text-slate-700 font-bold rounded-lg hover:bg-white/70 bg-white/50"
                                    > 
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (onApproveEdit) {
                                          onApproveEdit(
                                            record.id, 
                                            currentUserId,
                                            currentUserName,
                                            editRequestForm[`${record.id}_approval_reason`] || 'Edit approved'
                                          );
                                        }
                                        setShowApprovalForm({ ...showApprovalForm, [record.id]: false });
                                      }}
                                      className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg"
                                    >
                                      Approve
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

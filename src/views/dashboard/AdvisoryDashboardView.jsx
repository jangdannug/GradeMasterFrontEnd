import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Trash2, BookOpen, User, History, X, Search, Check, AlertCircle } from 'lucide-react';
import { theme } from '../../theme';
import { SearchableSelect } from '../../components/ui/SearchableSelect';

export function AdvisoryDashboardView({ 
  allSections, 
  currentTeacherId, 
  students, 
  subjects, 
  baseSubjects, 
  users,
  onAddStudent, 
  onAssignStudent,
  onRemoveStudent,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  activeView = 'students',
  syncError
}) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = React.useState('');
  const [selectedStudentsToAssign, setSelectedStudentsToAssign] = React.useState([]);
  const [isAddingSubject, setIsAddingSubject] = React.useState(false);
  const [editingSubjectId, setEditingSubjectId] = React.useState(null);
  const [subjectFormData, setSubjectFormData] = React.useState({ baseSubjectId: '', teacherId: '' });
  const [localError, setLocalError] = React.useState('');

  const adviserSection = allSections.find(s => s.adviserId === currentTeacherId);
  const myStudents = adviserSection ? students.filter(s => s.sectionId === adviserSection.id) : [];
  const teachers = users.filter(u => u.role === 'teacher' || u.role === 'adviser');

  const getStudentInitials = (fullName) => {
    const parts = fullName.split(',');
    if (parts.length < 2) return fullName.substring(0, 2).toUpperCase(); // Fallback
    const lastName = parts[0].trim();
    const firstNameParts = parts[1].trim().split(' ');
    const firstName = firstNameParts[0].trim();
    if (!firstName || !lastName) return fullName.substring(0, 2).toUpperCase(); // Fallback
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };


  const availableStudents = React.useMemo(() => {
    if (!adviserSection) return [];
    return students.filter(s => 
      s.gradeLevel === adviserSection.gradeLevel &&
      (!s.sectionId || s.sectionId === '') &&
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, adviserSection, studentSearchQuery]);

  const handleAddSubject = (e) => {
    e.preventDefault();
    setLocalError('');
    if (subjectFormData.baseSubjectId && subjectFormData.teacherId && adviserSection) {
      const teacher = teachers.find(t => t.id === subjectFormData.teacherId);
      if (!teacher) return;
      try {
        onAddSubject({
          baseSubjectId: subjectFormData.baseSubjectId,
          teacherId: teacher.id,
          teacherName: teacher.name,
          sectionId: adviserSection.id
        });
        setSubjectFormData({ baseSubjectId: '', teacherId: '' });
        setIsAddingSubject(false);
      } catch (err) {
        setLocalError(err.message || 'Failed to add subject');
      }
    } else {
      setLocalError('Please select both a subject template and a teacher.');
    }
  };

  const handleUpdateSubject = (e) => {
    e.preventDefault();
    setLocalError('');
    if (editingSubjectId && subjectFormData.teacherId) {
      const teacher = teachers.find(t => t.id === subjectFormData.teacherId);
      if (!teacher) return;
      try {
        onUpdateSubject(editingSubjectId, {
          teacherId: teacher.id,
          teacherName: teacher.name
        });
        setEditingSubjectId(null);
        setSubjectFormData({ baseSubjectId: '', teacherId: '' });
      } catch (err) {
        setLocalError(err.message || 'Failed to update subject');
      }
    } else {
      setLocalError('Please select a teacher.');
    }
  };

  const handleAssignSelectedStudents = () => {
    if (!adviserSection) return;
    selectedStudentsToAssign.forEach(studentId => {
      onAssignStudent(studentId, adviserSection.id);
    });
    setSelectedStudentsToAssign([]);
    setIsAdding(false);
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentsToAssign(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  const handleSelectAllStudents = () => {
  const visibleStudentIds = availableStudents.map(s => s.id);

  const allSelected = visibleStudentIds.every(id =>
    selectedStudentsToAssign.includes(id)
  );

  if (allSelected) {
    // Unselect all visible students
    setSelectedStudentsToAssign(prev =>
      prev.filter(id => !visibleStudentIds.includes(id))
    );
  } else {
    // Select all visible students
    setSelectedStudentsToAssign(prev => [
      ...new Set([...prev, ...visibleStudentIds])
    ]);
  }
};

  const assignedCodes = React.useMemo(() => {
    if (!adviserSection) return new Set();
    return new Set(subjects.filter(s => s.sectionId === adviserSection.id).map(s => s.code));
  }, [subjects, adviserSection]);

  const subjectOptions = baseSubjects
    .filter(b => b.gradeLevel === adviserSection?.gradeLevel && !assignedCodes.has(b.code))
    .map(b => ({ value: b.id, label: `${b.name} (${b.code})` }));

  const teacherOptions = teachers.map(t => ({ 
    value: t.id, 
    label: t.name 
  }));

  if (!adviserSection) return null;

  const isAllSelected =
  availableStudents.length > 0 &&
  availableStudents.every(student =>
    selectedStudentsToAssign.includes(student.id)
  );
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {(syncError || localError) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase tracking-tight shadow-sm"
        >
          <AlertCircle size={20} className="shrink-0" />
          <div className="flex-1">{localError || (syncError?.message || String(syncError))}</div>
          <button onClick={() => setLocalError('')} className="p-1 hover:bg-rose-100 rounded-lg transition-colors"><X size={16} /></button>
        </motion.div>
      )}

      {activeView === 'students' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className={`${theme.styles.card} p-8 flex flex-col md:flex-row md:items-center justify-between gap-6`}>
            <div className="flex items-center gap-6">
              <div className={`size-14 bg-${theme.styles.primary} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100`}>
                <Users size={28} />
              </div>
              <div>
                <h2 className={`text-3xl ${theme.styles.heading} text-slate-800`}>Grade {adviserSection.gradeLevel} - {adviserSection.name} Students</h2>
                <p className="text-xs text-slate-500 font-medium">Manage student roster for your advisory class.</p>
              </div>
            </div>
            <button onClick={() => setIsAdding(!isAdding)} className={`${theme.styles.button} ${theme.styles.buttonPrimary} px-8`}>
              {isAdding ? 'Cancel' : <><Plus size={14} /> Add Student</>}
            </button>
          </div>

          <AnimatePresence>
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className={`${theme.styles.card} p-8 border-2 border-indigo-100 space-y-4 max-w-4xl mx-auto`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase italic text-slate-800">Available Enrolled Students</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Assign unassigned Grade {adviserSection.gradeLevel} students to your section</p>
                  </div>
                  {availableStudents.length > 0 && (
                    <button 
                      onClick={handleSelectAllStudents}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:text-indigo-600 transition-all"
                    >
                      <div className={`size-3 rounded border flex items-center justify-center ${isAllSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                        {isAllSelected && <Check size={8} className="text-white" />}
                      </div>
                      {isAllSelected ? 'Unselect All' : 'Select All'}
                    </button>
                  )}
                  <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {availableStudents.length > 0 ? (
                    availableStudents.map(student => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ${student.gender === 'MALE' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                            {student.gender === 'MALE' ? 'M' : 'F'}
                          </div>
                          <span className="text-[11px] font-black text-slate-700 uppercase">{student.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedStudentsToAssign.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase italic">No unassigned Grade {adviserSection.gradeLevel} students found</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      placeholder="Search student name..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className={`${theme.styles.input} pl-10 py-2.5 text-sm`}
                    />
                  </div>
                  <button 
                    onClick={handleAssignSelectedStudents}
                    disabled={selectedStudentsToAssign.length === 0}
                    className={`${theme.styles.button} ${theme.styles.buttonPrimary} py-2.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Check size={18} /> Add {selectedStudentsToAssign.length > 0 ? `(${selectedStudentsToAssign.length})` : ''} Student(s)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myStudents.sort((a,b) => a.name.localeCompare(b.name)).map(student => (
              <div key={student.id} className={`${theme.styles.card} p-4 flex items-center justify-between group`}>
                <div className="flex items-center gap-3">
                  <div className={`size-10 ${theme.styles.radiusSm} flex items-center justify-center text-xs font-black shadow-sm ${student.gender === 'MALE' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                    {getStudentInitials(student.name)}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-800 uppercase line-clamp-1">{student.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">ID: {student.id}</p>
                  </div>
                </div>
                <button onClick={() => onRemoveStudent(student.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'curriculum' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-4xl">
          <div className={`${theme.styles.card} p-8 space-y-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg ${theme.styles.heading} text-slate-800 flex items-center gap-2`}>
                   <BookOpen size={18} className={`text-${theme.styles.primary}`} /> Subjects
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class Curriculum</p>
              </div>
              <button 
                onClick={() => { setIsAddingSubject(!isAddingSubject); setEditingSubjectId(null); setSubjectFormData({ baseSubjectId: '', teacherId: '' }); }}
                className={`p-2 bg-${theme.styles.primaryLight} text-${theme.styles.primary} rounded-xl hover:bg-indigo-100 transition-all`}
              ><Plus size={18} /></button>
            </div>

            <AnimatePresence>
              {(isAddingSubject || editingSubjectId) && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  onSubmit={editingSubjectId ? handleUpdateSubject : handleAddSubject}
                  className={`p-4 bg-slate-50 ${theme.styles.radiusSm} border border-slate-200 space-y-3`}
                >
                  <p className={`text-[10px] font-black text-${theme.styles.primary} uppercase tracking-widest`}>
                    {editingSubjectId ? 'Edit Subject' : 'New Subject'}
                  </p>
                  <div className="space-y-3">
                    {!editingSubjectId && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Subject Template</label>
                        <SearchableSelect 
                          options={subjectOptions}
                          value={subjectFormData.baseSubjectId}
                          onChange={(val) => setSubjectFormData({...subjectFormData, baseSubjectId: val})}
                          placeholder="Search template..."
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Assign Teacher</label>
                      <SearchableSelect 
                        options={teacherOptions}
                        value={subjectFormData.teacherId}
                        onChange={(val) => setSubjectFormData({...subjectFormData, teacherId: val})}
                        placeholder="Search teacher..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" className={`flex-1 ${theme.styles.button} ${theme.styles.buttonPrimary} py-2`}>{editingSubjectId ? 'Update' : 'Add Subject'}</button>
                    <button type="button" onClick={() => { setIsAddingSubject(false); setEditingSubjectId(null); }} className={`px-4 py-2 bg-white text-slate-400 border border-slate-200 ${theme.styles.radiusSm} text-[10px] font-black uppercase`}>Cancel</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {subjects.filter(s => s.sectionId === adviserSection.id).map(sub => (
                <div key={sub.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between group hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-3">{sub.name}</h4>
                    <div className="flex items-center gap-3">
                      <div className="size-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
                        <User size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Assigned Teacher</p>
                        <p className="text-sm font-black text-slate-800 uppercase truncate leading-none">{sub.teacherName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingSubjectId(sub.id); setSubjectFormData({ teacherId: sub.teacherId }); }} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors" title="Edit Subject"><History size={14} /></button>
                    <button onClick={() => { if (window.confirm(`Are you sure you want to remove ${sub.name} from this class?`)) onDeleteSubject(sub.id); }} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors" title="Delete Subject"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
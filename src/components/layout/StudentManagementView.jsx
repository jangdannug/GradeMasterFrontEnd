import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, CheckCircle, Plus, Search, Trash2, Edit, X, Layers, GraduationCap, Users, Upload, Download, School } from 'lucide-react';
import { theme } from '../../theme';
import schoolService from '../../services/schoolService';

export function StudentManagementView({ 
  onEnrollStudent, 
  sections, 
  schoolYears = [], 
  students = [], // All students
  onUpdateStudent,
  onRemoveStudent,
  onSync,
  onBulkEnroll,
  currentUser
}) {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    gender: 'MALE',
    gradeLevel: '7',
    schoolYear: schoolYears[0] || '2025-2026',
    schoolId: currentUser?.schoolId || '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false); // For single enrollment success message
  const [activeTab, setActiveTab] = useState('enroll'); // 'enroll' | 'manage' | 'bulk-upload'
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [schools, setSchools] = useState([]);

  React.useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      schoolService.getSchools()
        .then(setSchools)
        .catch(err => console.error("Failed to fetch schools:", err));
    }
  }, [currentUser]);

  const [isUploading, setIsUploading] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);

  React.useEffect(() => {
    onSync?.();
  }, [onSync]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (formData.lastName.trim() && formData.firstName.trim()) {
      onEnrollStudent(
        formData.lastName,
        formData.firstName,
        formData.middleName,
        formData.gender,
        formData.gradeLevel,
        formData.schoolYear,
        formData.schoolId
      );
      setIsSubmitted(true);
      // Optionally reset form after submission
      setFormData({
        lastName: '',
        firstName: '',
        middleName: '',
        gender: 'MALE',
        gradeLevel: '7',
        schoolYear: schoolYears[0] || '2025-2026',
        schoolId: currentUser?.schoolId || '',
      });
    }
  };

  const filteredStudents = React.useMemo(() => {
    let filtered = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (gradeFilter !== 'all') filtered = filtered.filter(s => s.gradeLevel === gradeFilter);
    if (genderFilter !== 'all') filtered = filtered.filter(s => s.gender === genderFilter);
    if (currentUser?.role === 'superadmin' && schoolFilter !== 'all') filtered = filtered.filter(s => String(s.schoolId) === String(schoolFilter));
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, searchQuery, gradeFilter, genderFilter, schoolFilter, currentUser]);

  const getStudentInitials = (fullName) => {
    const parts = fullName.split(',');
    if (parts.length < 2) return fullName.substring(0, 2).toUpperCase(); // Fallback
    const lastName = parts[0].trim();
    const firstNameParts = parts[1].trim().split(' ');
    const firstName = firstNameParts[0].trim();
    if (!firstName || !lastName) return fullName.substring(0, 2).toUpperCase(); // Fallback
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await onBulkEnroll(file, formData.schoolYear, formData.schoolId);
      
      // Check if backend returned success: false even with a 200 OK
      if (result && result.success === false) {
        throw new Error(result.message || "Server processed file but returned failure.");
      }

      alert(result?.message || `Bulk upload completed successfully.`);
      setActiveTab('manage');
    } catch (err) {
      alert(`Upload failed: ${err}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (isSubmitted && activeTab === 'enroll') { // Only show success message if on enroll tab
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${theme.styles.card} p-10 text-center space-y-6 max-w-md mx-auto`}
      >
        <div className="size-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
          <CheckCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Student Enrolled!</h2>
          <p className="text-sm font-medium text-slate-500">The student has been successfully added to the system. You can now assign them to a section.</p>
        </div>
        <button 
          onClick={() => { setIsSubmitted(false); setActiveTab('enroll'); }} // Go back to enroll tab after enrolling
          className={`${theme.styles.button} ${theme.styles.buttonPrimary} w-full`}
        >
          Enroll Another Student
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-8 shadow-sm">
        <TabButton 
          active={activeTab === 'enroll'} 
          onClick={() => setActiveTab('enroll')}
          icon={<Plus size={14} />}
          label="Enroll New Student"
        />
        <TabButton 
          active={activeTab === 'manage'} 
          onClick={() => setActiveTab('manage')}
          icon={<Users size={14} />}
          label="Manage Enrolled Students"
        />
        <TabButton 
          active={activeTab === 'bulk-upload'} 
          onClick={() => setActiveTab('bulk-upload')}
          icon={<Upload size={14} />}
          label="Bulk Upload"
        />
      </div>

      {activeTab === 'enroll' && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className={`${theme.styles.card} p-8 space-y-6 max-w-2xl mx-auto`}
        >
          <h2 className={`text-2xl ${theme.styles.heading} text-slate-800`}>Enroll New Student</h2>
          <p className="text-sm text-slate-500 font-medium">Add a new student to the school's roster. They can be assigned to a section later.</p>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Last Name</label>
              <input 
                autoFocus type="text" placeholder="e.g. DELA CRUZ" 
                value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value.toUpperCase() })} 
                className={theme.styles.input} required 
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">First Name</label>
              <input 
                type="text" placeholder="e.g. JUAN" 
                value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value.toUpperCase() })} 
                className={theme.styles.input} required 
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Middle Name <span className="lowercase font-medium text-slate-300">(Optional)</span></label>
              <input 
                type="text" placeholder="e.g. PROTACIO" 
                value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value.toUpperCase() })} 
                className={theme.styles.input} 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Gender</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className={theme.styles.input}>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Grade Level</label>
              <select value={formData.gradeLevel} onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} className={theme.styles.input}>
                {['7', '8', '9', '10', '11', '12'].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">School Year</label>
              <select value={formData.schoolYear} onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })} className={theme.styles.input}>
                {schoolYears.map(sy => (
                  <option key={sy} value={sy}>{sy}</option>
                ))}
              </select>
            </div>

            <button type="submit" className={`mt-4 md:col-span-2 ${theme.styles.button} ${theme.styles.buttonPrimary} py-4`}>
              <User size={18} /> Enroll Student
            </button>
          </form>
        </motion.div>
      )}

      {activeTab === 'manage' && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="space-y-6"
        >
          <div className={`${theme.styles.card} p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
            <h2 className={`text-2xl ${theme.styles.heading} text-slate-800`}>Manage Enrolled Students</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${theme.styles.input} pl-10 py-2.5 text-sm w-full md:w-64`}
                />
              </div>
              <select 
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className={`${theme.styles.input} text-sm w-full md:w-36`}
              >
                <option value="all">All Grades</option>
                {['7', '8', '9', '10', '11', '12'].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
              <select 
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className={`${theme.styles.input} text-sm w-full md:w-36`}
              >
                <option value="all">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              {currentUser?.role === 'superadmin' && (
                <select 
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className={`${theme.styles.input} text-sm w-full md:w-48`}
                >
                  <option value="all">All Schools</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
              <button 
                onClick={() => { 
                  setSearchQuery(''); setGradeFilter('all'); setGenderFilter('all'); setSchoolFilter('all');
                }}
                className={`${theme.styles.button} bg-slate-100 text-slate-600 hover:bg-slate-200 py-2.5`}
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <StudentCard 
                  key={student.id} 
                  student={student} 
                  onUpdateStudent={onUpdateStudent} 
                  onRemoveStudent={onRemoveStudent} 
                  sections={sections} // Pass sections for potential assignment
                  getStudentInitials={getStudentInitials}
                />
              ))
            ) : (
              <div className="col-span-full py-10 text-center text-slate-400">
                <p className="font-bold">No students found matching your criteria.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'bulk-upload' && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className={`${theme.styles.card} p-8 space-y-6 max-w-2xl mx-auto`}
        >
          <h2 className={`text-2xl ${theme.styles.heading} text-slate-800`}>Bulk Enroll Students</h2>
          <p className="text-sm text-slate-500 font-medium">Upload a CSV file to enroll multiple students at once.</p>

          <div className="space-y-4">
            <button
              onClick={() => {
                const headers = ['last_name', 'first_name', 'middle_name', 'gender', 'grade_level', 'school_year', 'school_id'];
                const samples = [
                  ['DELA CRUZ', 'JUAN', 'PROTACIO', 'MALE', '10', '2025-2026', formData.schoolId || '123456'],
                  ['SANTOS', 'MARIA', 'CLARA', 'FEMALE', '10', '2025-2026', formData.schoolId || '123456']
                ];
                const csvContent = "data:text/csv;charset=utf-8," + [headers, ...samples].map(e => e.join(",")).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "student_enrollment_template.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className={`${theme.styles.button} ${theme.styles.buttonPrimary} w-full`}
            >
              <Download size={18} /> Download CSV Template
            </button>

            <label className="block text-sm font-medium text-slate-700">Upload Student CSV File {isUploading && '(Uploading...)'}</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkUpload}
              disabled={isUploading}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold disabled:opacity-50
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={() => onClick()}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${
        active 
          ? 'bg-white text-indigo-600 shadow-sm' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StudentCard({ student, onUpdateStudent, onRemoveStudent, sections, getStudentInitials }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...student });

  const currentSection = sections.find(s => s.id === student.sectionId);

  const handleSave = () => {
    onUpdateStudent(student.id, editFormData);
    setIsEditing(false);
  };

  return (
    <div className={`${theme.styles.card} p-4 flex flex-col gap-3 h-full`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`size-10 ${theme.styles.radiusSm} flex items-center justify-center text-xs font-black shadow-sm ${student.gender === 'MALE' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'} shrink-0`}>
            {getStudentInitials(student.name)}
          </div>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <input 
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value.toUpperCase()})}
                className="text-sm font-black text-slate-800 uppercase leading-tight w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            ) : (
              <p className="text-sm font-black text-slate-800 uppercase leading-tight">{student.name}</p>
            )}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ID: {student.id}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 border-t border-slate-100 pt-3">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">Grade Level</p>
          {isEditing ? (
            <select 
              value={editFormData.gradeLevel}
              onChange={(e) => setEditFormData({...editFormData, gradeLevel: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs"
            >
              {['7', '8', '9', '10', '11', '12'].map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          ) : (
            <p className="font-bold">Grade {student.gradeLevel}</p>
          )}
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">Gender</p>
          {isEditing ? (
            <select 
              value={editFormData.gender}
              onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          ) : (
            <p className="font-bold">{student.gender}</p>
          )}
        </div>
        <div className="col-span-2">
          <p className="text-[9px] font-black text-slate-400 uppercase">Current Section</p>
          {isEditing ? (
            <select 
              value={editFormData.sectionId || ''}
              onChange={(e) => setEditFormData({...editFormData, sectionId: e.target.value || null})}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs"
            >
              <option value="">Unassigned</option>
              {sections.filter(s => s.gradeLevel === student.gradeLevel).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          ) : (
            <p className="font-bold">{currentSection ? `${currentSection.name} (SY ${currentSection.schoolYear})` : 'Unassigned'}</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-1 mt-auto pt-2">
        {isEditing ? (
          <>
            <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Save">
              <CheckCircle size={14} /> Save
            </button>
            <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-lg transition-colors" title="Cancel">
              <X size={14} /> Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Student">
              <Edit size={14} /> Edit
            </button>
            <button onClick={() => onRemoveStudent(student.id)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Student">
              <Trash2 size={14} /> Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, CheckCircle, Plus, Search, Trash2, Edit, X, GraduationCap, Users, Upload, Download, School, Calendar, MapPin, Languages, ShieldCheck } from 'lucide-react';
import { theme } from '../../theme';
import schoolService from '../../services/schoolService';

const getStudentInitials = (fullName) => {
  if (!fullName) return '??';
  const parts = fullName.split(',');
  if (parts.length < 2) return fullName.substring(0, 2).toUpperCase();
  const lastName = parts[0].trim();
  const firstNameParts = parts[1].trim().split(' ');
  const firstName = firstNameParts[0].trim();
  if (!firstName || !lastName) return fullName.substring(0, 2).toUpperCase();
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

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
    lrn: '', // NEW
    lastName: '',
    firstName: '',
    middleName: '',
    birthdate: '', // NEW
    gender: 'MALE',
    address: '', // NEW
    motherTongue: 'TAGALOG', // NEW
    religion: 'ROMAN CATHOLIC', // NEW
    ethnicGroup: 'TAGALOG', // NEW
    hasDisability: false, // NEW
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

  const calculateAge = (birthdate) => {
    if (!birthdate) return 'N/A';
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const [isUploading, setIsUploading] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);

  React.useEffect(() => {
    onSync?.();
  }, [onSync]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    // Basic validation for required fields
    if (!formData.lastName.trim() || !formData.firstName.trim() || !formData.lrn.trim()) {
      alert("Please ensure LRN and all name fields are filled.");
      return;
    }
    if (!formData.birthdate) {
      alert("Please select a birthdate.");
      return;
    }

    onEnrollStudent(formData); // Pass the entire formData object
      setIsSubmitted(true);
      // Optionally reset form after submission
      setFormData({
        ...formData, // Keep schoolYear, gradeLevel, gender, schoolId
        lastName: '',
        firstName: '',
        middleName: '',
        lrn: '',
        birthdate: '',
        address: '',
        motherTongue: 'TAGALOG',
        religion: 'ROMAN CATHOLIC',
        ethnicGroup: 'TAGALOG',
      });
  };

  const filteredStudents = React.useMemo(() => {
    let filtered = students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      String(s.lrn).includes(searchQuery)
    );
    if (gradeFilter !== 'all') filtered = filtered.filter(s => s.gradeLevel === gradeFilter);
    if (genderFilter !== 'all') filtered = filtered.filter(s => s.gender === genderFilter);
    if (currentUser?.role === 'superadmin' && schoolFilter !== 'all') filtered = filtered.filter(s => String(s.schoolId) === String(schoolFilter));
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, searchQuery, gradeFilter, genderFilter, schoolFilter, currentUser]);

  const handleBulkDownload = () => {
    const headers = [
      'last_name', 'first_name', 'middle_name', 'gender', 'grade_level', 
      'school_year', 'lrn', 'birthdate', 'address', 'mother_tongue', 
      'religion', 'ethnic_group', 'has_disability'
    ];
    const sample = [
      'DELA CRUZ', 'JUAN', 'PROTACIO', 'MALE', '7', '2025-2026', 
      '123456789012', '2012-05-15', '123 street, Manila', 'TAGALOG', 
      'ROMAN CATHOLIC', 'TAGALOG', 'false'
    ];
    const csvString = [headers, sample].map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "student_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          label="Detailed Enrollment"
        />
        <TabButton 
          active={activeTab === 'manage'} 
          onClick={() => setActiveTab('manage')}
          icon={<Users size={14} />}
          label="Learner Roster"
        />
        <TabButton 
          active={activeTab === 'bulk-upload'} 
          onClick={() => setActiveTab('bulk-upload')}
          icon={<Upload size={14} />}
          label="Bulk Upload"
        />
      </div>

      {activeTab === 'enroll' && (
        <motion.form 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          onSubmit={handleAddSubmit}
          className={`${theme.styles.card} p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6`}
        >
          <div className="md:col-span-3 pb-2 border-b border-slate-100 mb-2">
            <h2 className={theme.styles.heading}>Learner Registration</h2>
            <p className="text-xs text-slate-500 font-bold uppercase">Basic Learner Information System (LIS) Entry</p>
          </div>

          <div className="space-y-1">
            <label className={theme.styles.subheading}>Learner Reference Number</label>
            <input 
              required type="text" placeholder="Enter LRN"
              value={formData.lrn} onChange={e => setFormData({...formData, lrn: e.target.value.replace(/\D/g, '')})} // Only allow digits
              className={theme.styles.input}
            />
          </div>

          <div className="md:col-span-2 invisible md:block" />

          <div className="space-y-1">
            <label className={theme.styles.subheading}>Last Name</label>
            <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value.toUpperCase()})} className={theme.styles.input} />
          </div>
          <div className="space-y-1">
            <label className={theme.styles.subheading}>First Name</label>
            <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value.toUpperCase()})} className={theme.styles.input} />
          </div>
          <div className="space-y-1">
            <label className={theme.styles.subheading}>Middle Name</label>
            <input type="text" value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value.toUpperCase()})} className={theme.styles.input} />
          </div>

          <div className="space-y-1">
            <label className={theme.styles.subheading}>Birthdate</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /> {/* Icon for date picker */}
              <input required type="date" value={formData.birthdate} onChange={e => setFormData({...formData, birthdate: e.target.value})} className={`${theme.styles.input} pl-10`} />
            </div>
          </div>
          <div className="space-y-1">
            <label className={theme.styles.subheading}>Gender</label>
            <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className={theme.styles.input}>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className={theme.styles.subheading}>Mother Tongue</label> {/* Dropdown for Mother Tongue */}
            <input list="languages" value={formData.motherTongue} onChange={e => setFormData({...formData, motherTongue: e.target.value.toUpperCase()})} className={theme.styles.input} />
            <datalist id="languages">
              <option value="TAGALOG" /><option value="ILOCANO" /><option value="CEBUANO" /><option value="HILIGAYNON" /><option value="WARAY" />
            </datalist>
          </div>

          <div className="space-y-1">
            <label className={theme.styles.subheading}>Religion</label> {/* Input for Religion */}
            <input type="text" value={formData.religion} onChange={e => setFormData({...formData, religion: e.target.value.toUpperCase()})} className={theme.styles.input} />
          </div>
          <div className="space-y-1">
            <label className={theme.styles.subheading}>Ethnic Group</label> {/* Input for Ethnic Group */}
            <input type="text" value={formData.ethnicGroup} onChange={e => setFormData({...formData, ethnicGroup: e.target.value.toUpperCase()})} className={theme.styles.input} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" id="disability" checked={formData.hasDisability} onChange={e => setFormData({...formData, hasDisability: e.target.checked})} className="size-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="disability" className="text-xs font-black uppercase text-slate-600">Has Disability?</label>
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className={theme.styles.subheading}>Physical Address</label> {/* Textarea for Address */}
            <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})} className={`${theme.styles.input} resize-none`} placeholder="HOUSE NO, STREET, BARANGAY, MUNICIPALITY..." />
          </div>

          <button type="submit" className={`md:col-span-3 ${theme.styles.button} ${theme.styles.buttonPrimary} py-4 mt-4`}>
            <CheckCircle size={18} /> Register Learner to System
          </button>
        </motion.form>
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search LRN or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${theme.styles.input} !pl-11 py-2.5 text-sm w-full md:w-64`}
                />
              </div>
              <select 
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className={`${theme.styles.input} !bg-white/50 !border-white/60 text-sm w-full md:w-36`}
              >
                <option value="all">All Grades</option>
                {['7', '8', '9', '10', '11', '12'].map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
              <select 
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className={`${theme.styles.input} !bg-white/50 !border-white/60 text-sm w-full md:w-36`}
              >
                <option value="all">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              {currentUser?.role === 'superadmin' && (
                <select 
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className={`${theme.styles.input} !bg-white/50 !border-white/60 text-sm w-full md:w-64 !h-auto !py-2 !leading-tight break-words whitespace-normal`}
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

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest"><th className="p-5">LRN</th>
                  <th className="p-5">Learner Name</th>
                  <th className="p-5 text-center">Age</th>
                  <th className="p-5">Gender</th>
                  <th className="p-5">Grade / Section</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors"><td className="p-5 font-mono text-indigo-600 font-bold">{student.lrn}</td>
                    <td className="p-5 font-black text-slate-800 uppercase">{student.name}</td>
                    <td className="p-5 text-center font-bold text-slate-600">{calculateAge(student.birthdate)}</td>
                    <td className="p-5 font-bold text-slate-500">{student.gender}</td>
                    <td className="p-5">
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black uppercase text-slate-500">
                        G{student.gradeLevel} - {sections.find(s => s.id === student.sectionId)?.name || 'UNASSIGNED'}
                      </span>
                    </td>
                    <td className="p-5 text-right flex justify-end gap-2">
                       <button onClick={() => onRemoveStudent(student.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <h2 className={`text-2xl ${theme.styles.heading} text-slate-800`}>Bulk Learner Import</h2>
          <p className="text-sm text-slate-500 font-medium">Upload a CSV file to enroll multiple students at once.</p>
          
          <div className="space-y-4">
            <button onClick={handleBulkDownload} className={`${theme.styles.button} bg-slate-800 text-white hover:bg-black w-full`}>
              <Download size={18} /> Download New CSV Template
            </button>
            <input 
              type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
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
      onClick={onClick}
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
  
  const calculateAge = (birthdate) => {
    if (!birthdate) return 'N/A';
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const currentSection = sections.find(s => s.id === student.sectionId);

  const handleSave = () => {
    onUpdateStudent(student.id, {
      ...editFormData,
      name: `${editFormData.lastName || ''}, ${editFormData.firstName || ''} ${editFormData.middleName || ''}`.trim().toUpperCase()
    });
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
            ) : ( // Display full name from parts
              <p className="text-sm font-black text-slate-800 uppercase leading-tight">{`${student.lastName}, ${student.firstName} ${student.middleName}`}</p>
            )}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">LRN: {student.lrn}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 border-t border-slate-100 pt-3">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">LRN</p>
          {isEditing ? (
            <input 
              type="text"
              value={editFormData.lrn}
              onChange={(e) => setEditFormData({...editFormData, lrn: e.target.value.replace(/\D/g, '')})}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs"
            />
            ) : (
              <p className="font-bold">{student.lrn}</p>
            )}
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">Birthdate</p>
          {isEditing ? (
            <input 
              type="date"
              value={editFormData.birthdate}
              onChange={(e) => setEditFormData({...editFormData, birthdate: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs"
            />
          ) : (
            <p className="font-bold">{student.birthdate}</p>
          )}
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">Age</p>
          <p className="font-bold">{calculateAge(student.birthdate)}</p>
        </div>

        {/* Name fields for editing */}
        {isEditing && (
          <>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Last Name</p>
              <input type="text" value={editFormData.lastName} onChange={e => setEditFormData({...editFormData, lastName: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">First Name</p>
              <input type="text" value={editFormData.firstName} onChange={e => setEditFormData({...editFormData, firstName: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Middle Name</p>
              <input type="text" value={editFormData.middleName} onChange={e => setEditFormData({...editFormData, middleName: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs" />
            </div>
          </>
        )}

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
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">Mother Tongue</p>
          {isEditing ? (
            <input type="text" value={editFormData.motherTongue} onChange={e => setEditFormData({...editFormData, motherTongue: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs" />
          ) : (
            <p className="font-bold">{student.motherTongue}</p>
          )}
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">Religion</p>
          {isEditing ? (
            <input type="text" value={editFormData.religion} onChange={e => setEditFormData({...editFormData, religion: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs" />
          ) : (
            <p className="font-bold">{student.religion}</p>
          )}
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">Ethnic Group</p>
          {isEditing ? (
            <input type="text" value={editFormData.ethnicGroup} onChange={e => setEditFormData({...editFormData, ethnicGroup: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs" />
          ) : (
            <p className="font-bold">{student.ethnicGroup}</p>
          )}
        </div>
        <div className="col-span-2">
          <p className="text-[9px] font-black text-slate-400 uppercase">Address</p>
          {isEditing ? (
            <textarea rows={2} value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs resize-none" />
          ) : (
            <p className="font-bold">{student.address}</p>
          )}
        </div>
        <div className="col-span-2 flex items-center gap-3">
          {isEditing ? (
            <>
              <input type="checkbox" id={`edit-disability-${student.id}`} checked={editFormData.hasDisability} onChange={e => setEditFormData({...editFormData, hasDisability: e.target.checked})} className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor={`edit-disability-${student.id}`} className="text-[9px] font-black uppercase text-slate-600">Has Disability?</label>
            </>
          ) : (
            <p className="font-bold flex items-center gap-2"><ShieldCheck size={12} className={student.hasDisability ? 'text-rose-500' : 'text-slate-300'} /> {student.hasDisability ? 'With Disability' : 'No Disability'}</p>
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
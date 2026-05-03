import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, CheckCircle } from 'lucide-react';
import { theme } from '../theme';

export function StudentRegistrationView({ onEnrollStudent, sections, schoolYears = [] }) {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    gender: 'MALE',
    gradeLevel: '7',
    schoolYear: schoolYears[0] || '2025-2026',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (formData.lastName.trim() && formData.firstName.trim()) {
      onEnrollStudent(
        formData.lastName,
        formData.firstName,
        formData.middleName,
        formData.gender,
        formData.gradeLevel,
        formData.schoolYear
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
      });
    }
  };

  if (isSubmitted) {
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
          onClick={() => setIsSubmitted(false)}
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
  );
}
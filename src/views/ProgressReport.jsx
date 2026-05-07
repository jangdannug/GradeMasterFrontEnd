import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Trash2, Table, Eye, Search, Loader2, FileText, X, Printer } from 'lucide-react';
import gradingService from '../services/gradingService';
import { calculateSubjectResult } from '../utils/calculations';
import { theme } from '../theme';

export function ProgressReport({ 
  students, 
  subjects, 
  baseSubjects = [],
  section, 
  allSections = [],
  transmutationTable, 
  descriptors,
  savedClassRecords = [],
  maxQuarters = 4
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sf10Student, setSf10Student] = React.useState(null);
  const [sf9Student, setSf9Student] = React.useState(null); // New state for SF9 modal

  const getStudentInitials = (fullName) => {
    const parts = fullName.split(',');
    if (parts.length < 2) return fullName.substring(0, 2).toUpperCase(); // Fallback
    const lastName = parts[0].trim();
    const firstNameParts = parts[1].trim().split(' ');
    const firstName = firstNameParts[0].trim();
    if (!firstName || !lastName) return fullName.substring(0, 2).toUpperCase(); // Fallback
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const filteredStudents = React.useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  // Data processing for SF10 modal
  const sf10Data = React.useMemo(() => {
    if (!sf10Student) return null;
    
    const studentSubjects = subjects.filter(sub => String(sub.sectionId) === String(sf10Student.sectionId));
    
    const subjectGrades = studentSubjects.map(subject => {
      const template = baseSubjects.find(b => String(b.id) === String(subject.baseSubjectId));
      const effectiveCategories = (subject.categories && subject.categories.length > 0) ? subject.categories : (template?.categories || []);

      const quarters = Array.from({ length: maxQuarters }, (_, i) => i + 1).map(q => {
        const recordId = `${sf10Student.sectionId}-${subject.id}-Q${q}`;
        const verifiedRecord = savedClassRecords.find(r => r.id === recordId && r.isVerified);
        if (!verifiedRecord) return null;

        const snapshot = verifiedRecord.studentSnapshots?.find(s => String(s.id) === String(sf10Student.id));
        return calculateSubjectResult(snapshot?.grades, { ...subject, categories: effectiveCategories }, transmutationTable, descriptors);
      });

      const validScores = quarters.filter(q => q !== null).map(q => q.quarterly);
      const finalRating = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;

      return {
        name: subject.name,
        quarters: quarters.map(q => q?.quarterly || null),
        finalRating,
        action: finalRating >= 75 ? 'PASSED' : finalRating > 0 ? 'FAILED' : ''
      };
    });

    const genAvg = subjectGrades.length > 0 ? Math.round(subjectGrades.reduce((a, b) => a + b.finalRating, 0) / subjectGrades.length) : 0;

    return { subjectGrades, genAvg };
  }, [sf10Student, subjects, baseSubjects, savedClassRecords, maxQuarters, transmutationTable, descriptors]);

  // Data processing for SF9 modal
  const sf9Data = React.useMemo(() => {
    if (!sf9Student) return null;

    const studentSubjects = subjects.filter(sub => String(sub.sectionId) === String(sf9Student.sectionId));

    const subjectGrades = studentSubjects.map(subject => {
      const template = baseSubjects.find(b => String(b.id) === String(subject.baseSubjectId));
      const effectiveCategories = (subject.categories && subject.categories.length > 0) ? subject.categories : (template?.categories || []);

      const quarters = Array.from({ length: maxQuarters }, (_, i) => i + 1).map(q => {
        const recordId = `${sf9Student.sectionId}-${subject.id}-Q${q}`;
        const verifiedRecord = savedClassRecords.find(r => r.id === recordId && r.isVerified);
        if (!verifiedRecord) return null;

        const snapshot = verifiedRecord.studentSnapshots?.find(s => String(s.id) === String(sf9Student.id));
        const result = calculateSubjectResult(snapshot?.grades, { ...subject, categories: effectiveCategories }, transmutationTable, descriptors);
        return {
          quarter: q,
          score: result.quarterly,
          descriptor: result.descriptor
        };
      });

      const verifiedScores = quarters.filter(q => q !== null && q.score !== null).map(q => q.score);
      const finalRating = verifiedScores.length > 0
        ? Math.round(verifiedScores.reduce((a, b) => a + b, 0) / verifiedScores.length)
        : 0;

      return {
        name: subject.name,
        quarters: quarters, // Keep full quarter objects for SF9
        finalRating,
        action: finalRating >= 75 ? 'PASSED' : finalRating > 0 ? 'FAILED' : ''
      };
    });

    const genAvg = subjectGrades.length > 0 ? Math.round(subjectGrades.reduce((a, b) => a + b.finalRating, 0) / subjectGrades.length) : 0;

    return { subjectGrades, genAvg };
  }, [sf9Student, subjects, baseSubjects, savedClassRecords, maxQuarters, transmutationTable, descriptors]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 md:space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-6 rounded-2xl border border-slate-200 gap-4">
        <div>
          <h2 className={`text-xl ${theme.styles.heading} text-slate-800`}>Progress Report Cards</h2>
          <p className="text-sm text-slate-500">
            {section ? `Summary of all subjects for Section ${section.name}` : "Global Student Progress Overview"}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${theme.styles.input} pl-10 py-2.5 text-sm`}
            />
          </div>
          <button className={`${theme.styles.button} ${theme.styles.buttonPrimary} py-2.5`}>
            <Download size={18} />
            <span className="hidden md:inline">Export All</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredStudents.map(student => {
          // Filter subjects to only those assigned to the student's section
          const studentSubjects = subjects.filter(sub => String(sub.sectionId) === String(student.sectionId));
          
          // Only include results from verified (locked) records
          const subjectResults = studentSubjects.map(subject => {
            // Find template for effective categories (fallback logic)
            const template = baseSubjects.find(b => String(b.id) === String(subject.baseSubjectId));
            const effectiveCategories = (subject.categories && subject.categories.length > 0) ? subject.categories : (template?.categories || []);

            const quarterGrades = Array.from({ length: maxQuarters }, (_, i) => i + 1).map(q => {
              const recordId = `${student.sectionId}-${subject.id}-Q${q}`;
              const verifiedRecord = savedClassRecords.find(r => r.id === recordId && r.isVerified);
              
              if (!verifiedRecord) return { quarter: q, score: null };

              const studentSnapshot = verifiedRecord.studentSnapshots?.find(s => String(s.id) === String(student.id));
              const result = calculateSubjectResult(studentSnapshot?.grades, { ...subject, categories: effectiveCategories }, transmutationTable, descriptors);
              
              return { 
                quarter: q, 
                score: result.quarterly,
                descriptor: result.descriptor
              };
            });

            const verifiedScores = quarterGrades.filter(q => q.score !== null).map(q => q.score);
            const finalGrade = verifiedScores.length > 0 
              ? Math.round(verifiedScores.reduce((a, b) => a + b, 0) / verifiedScores.length) 
              : 0;
            
            const finalDescriptor = descriptors.find(d => finalGrade >= d.min && finalGrade <= d.max) || descriptors[descriptors.length - 1];

            return {
              id: subject.id,
              name: subject.name,
              quarterlyGrades: quarterGrades,
              finalGrade: finalGrade,
              finalDescriptor: finalDescriptor,
              isVerified: verifiedScores.length > 0
            };
          });

          const generalAverage = subjectResults.length > 0 
            ? Math.round(subjectResults.reduce((acc, curr) => acc + curr.finalGrade, 0) / subjectResults.length)
            : 0;
          const avgDescriptor = descriptors.find(d => generalAverage >= d.min && generalAverage <= d.max) || descriptors[descriptors.length - 1];

          return (
            <div key={student.id} className={`${theme.styles.card} overflow-hidden group`}>
               <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center group-hover:bg-slate-100/50 transition-colors gap-4">
                 <div className="flex items-center gap-4">
                   <div className={`size-12 ${theme.styles.radiusSm} flex items-center justify-center text-sm font-black shadow-sm ${student.gender === 'MALE' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'} shrink-0 transition-colors`}>
                     {getStudentInitials(student.name)}
                   </div>
                   <div className="min-w-0 flex-1">
                     <h4 className="font-bold text-slate-800 uppercase text-sm md:text-base truncate">{student.name}</h4>
                     <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase truncate">
                       {allSections.find(sec => String(sec.id) === String(student.sectionId))?.name || 'Unassigned'} • ID: {String(student.id).substring(0, 8)}
                     </p>
                   </div>
                 </div>
                 <div className="text-left sm:text-right">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">General Average</p>
                 <p className={`text-2xl md:text-3xl font-black leading-none ${generalAverage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {generalAverage}
                   </p>
                 <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${avgDescriptor?.color}`}>
                   {avgDescriptor?.label}
                 </p>
                 </div>
               </div>
               
               <div className="p-6 md:p-8 bg-white">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                   {subjectResults.map((res, i) => (
                     <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow space-y-4">
                       <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider truncate">{res.name}</p>
                       <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${maxQuarters}, minmax(0, 1fr))` }}>
                         {res.quarterlyGrades.map(q => (
                           <div key={q.quarter} className={`text-center py-1.5 rounded-lg border ${q.score === null ? 'border-transparent' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                             <p className="text-[6px] text-slate-400 font-black uppercase mb-0.5">Q{q.quarter}</p>
                             <p className={`text-xs font-black leading-none ${q.score === null ? 'text-slate-200' : q.score < 75 ? 'text-rose-500' : 'text-slate-800'}`}>
                               {q.score || '--'}
                             </p>
                             {q.score !== null && (
                               <p className={`text-[5px] font-black uppercase mt-1 leading-none ${q.descriptor?.color}`}>
                                 {q.descriptor?.label.substring(0, 3)}
                               </p>
                             )}
                           </div>
                         ))}
                       </div>
                       <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                         <div className="flex flex-col gap-1">
                           <span className="text-[9px] font-black text-slate-400 uppercase leading-none">Yearly Grade</span>
                           {res.isVerified && (
                             <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${res.finalDescriptor?.color}`}>
                               {res.finalDescriptor?.label}
                             </span>
                           )}
                         </div>
                         <span className={`text-xl font-black ${res.finalGrade >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {res.finalGrade || '--'}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap justify-end gap-2">
                    <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-2">
                      <Trash2 size={14} /> Clear
                    </button>
                    <button 
                      onClick={() => setSf10Student(student)}
                      className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
                    >
                      <FileText size={14} /> SF10 Permanent Record
                    </button>
                    <button
                      onClick={() => setSf9Student(student)} // New button for SF9
                      className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-100"
                    >
                      <FileText size={14} /> SF9 Progress Report
                    </button>
                 </div>
               </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {sf10Student && sf10Data && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center print:hidden">
                <div className="flex items-center gap-3">
                   <div className="size-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                     <FileText size={20} />
                   </div>
                   <div>
                     <h3 className="font-black uppercase tracking-tight italic">SF10: Learner's Permanent Record</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Preview & Print Mode</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-colors"
                   >
                     <Printer size={16} /> Print SF10
                   </button>
                   <button 
                    onClick={() => setSf10Student(null)}
                    className="size-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                   >
                     <X size={20} />
                   </button>
                </div>
              </div>

              {/* SF10 CONTENT (Printable Area) */}
              <div className="p-8 md:p-12 space-y-8 print:p-0 print:text-black" id="sf10-printable">
                <div className="text-center space-y-1">
                  <p className="text-xs font-medium italic">Republic of the Philippines</p>
                  <p className="text-sm font-bold uppercase tracking-wide">Department of Education</p>
                  <h2 className="text-lg font-black uppercase mt-4">Learner's Permanent Academic Record for Junior High School (SF10-JHS)</h2>
                  <p className="text-[10px] opacity-60">(Formerly Form 137)</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 border-y border-slate-200 py-6">
                  <SF10Info label="Learner's Name" value={sf10Student.name} colSpan={2} />
                  <SF10Info label="LRN" value={String(sf10Student.id).substring(0, 12)} />
                  <SF10Info label="Sex" value={sf10Student.gender} />
                </div>

                {/* Scholastic Record Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                    <h4 className="font-black uppercase italic text-sm">Scholastic Record</h4>
                    <p className="text-xs font-bold">SY: {sf10Student.schoolYear} | Grade {sf10Student.gradeLevel} - {section?.name || 'N/A'}</p>
                  </div>

                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead className="bg-slate-50">
                      <tr className="divide-x divide-slate-900 border-b border-slate-900">
                        <th rowSpan={2} className="p-2 text-left w-1/3">Learning Areas</th>
                        <th colSpan={maxQuarters} className="p-1 text-center">Quarterly Rating</th>
                        <th rowSpan={2} className="p-2 text-center w-20">Final Rating</th>
                        <th rowSpan={2} className="p-2 text-center w-24">Remarks</th>
                      </tr>
                      <tr className="divide-x divide-slate-900 border-b border-slate-900">
                        {Array.from({ length: maxQuarters }, (_, i) => (
                          <th key={i} className="p-1 text-center w-12">{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-400">
                      {sf10Data.subjectGrades.map((sub, idx) => (
                        <tr key={idx} className="divide-x divide-slate-400">
                          <td className="p-2 font-bold uppercase">{sub.name}</td>
                          {sub.quarters.map((q, i) => (
                            <td key={i} className="p-2 text-center">{q || ''}</td>
                          ))}
                          <td className="p-2 text-center font-black">{sub.finalRating || ''}</td>
                          <td className={`p-2 text-center font-black text-[9px] ${sub.action === 'FAILED' ? 'text-rose-600' : ''}`}>{sub.action}</td>
                        </tr>
                      ))}
                      <tr className="divide-x divide-slate-900 border-t border-slate-900 bg-slate-50 font-black">
                        <td className="p-2 text-right uppercase" colSpan={maxQuarters + 1}>General Average</td>
                        <td className="p-2 text-center text-lg">{sf10Data.genAvg}</td>
                        <td className="p-2 text-center uppercase">{sf10Data.genAvg >= 75 ? 'PASSED' : 'FAILED'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-12 grid grid-cols-2 gap-20">
                  <div className="text-center border-t border-black pt-2">
                    <p className="text-[10px] font-black uppercase">Registrar / School Head</p>
                    <p className="text-[8px] opacity-60">(Signature over Printed Name)</p>
                  </div>
                  <div className="text-center border-t border-black pt-2">
                    <p className="text-[10px] font-black uppercase">Date Issued</p>
                    <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {sf9Student && sf9Data && (
          <SF9Modal 
            student={sf9Student}
            sf9Data={sf9Data}
            section={allSections.find(s => String(s.id) === String(sf9Student.sectionId))}
            maxQuarters={maxQuarters}
            onClose={() => setSf9Student(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Reusing SF10Info for SF9 as well
function SF10Info({ label, value, colSpan = 1 }) {
  return (
    <div className={`space-y-1 ${colSpan > 1 ? `col-span-${colSpan}` : ''}`}>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
      <p className="text-sm font-black text-slate-900 uppercase border-b border-slate-100 pb-1">{value || 'N/A'}</p>
    </div>
  );
}

// New component for SF9 modal
function SF9Modal({ student, sf9Data, section, maxQuarters, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight italic">SF9: Learner's Progress Report Card</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Preview & Print Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-colors"
            >
              <Printer size={16} /> Print SF9
            </button>
            <button
              onClick={onClose}
              className="size-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* SF9 CONTENT (Printable Area) */}
        <div className="p-8 md:p-12 space-y-8 print:p-0 print:text-black" id="sf9-printable">
          <div className="text-center space-y-1">
            <p className="text-xs font-medium italic">Republic of the Philippines</p>
            <p className="text-sm font-bold uppercase tracking-wide">Department of Education</p>
            <h2 className="text-lg font-black uppercase mt-4">Learner's Progress Report Card (SF9)</h2>
            <p className="text-[10px] opacity-60">(Formerly Form 138)</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 border-y border-slate-200 py-6">
            <SF10Info label="Learner's Name" value={student.name} colSpan={2} />
            <SF10Info label="LRN" value={String(student.id).substring(0, 12)} />
            <SF10Info label="Sex" value={student.gender} />
            <SF10Info label="Grade Level" value={student.gradeLevel} />
            <SF10Info label="Section" value={section?.name || 'N/A'} />
            <SF10Info label="School Year" value={student.schoolYear} colSpan={2} />
          </div>

          {/* Scholastic Record Table */}
          <div className="space-y-4">
            <h4 className="font-black uppercase italic text-sm border-b-2 border-slate-900 pb-2">Scholastic Record</h4>
            <table className="w-full border-collapse border border-slate-900 text-xs">
              <thead className="bg-slate-50">
                <tr className="divide-x divide-slate-900 border-b border-slate-900">
                  <th className="p-2 text-left w-1/3">Learning Areas</th>
                  {Array.from({ length: maxQuarters }, (_, i) => (
                    <th key={i} className="p-1 text-center w-12">Q{i + 1}</th>
                  ))}
                  <th className="p-2 text-center w-20">Final Rating</th>
                  <th className="p-2 text-center w-24">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-400">
                {sf9Data.subjectGrades.map((sub, idx) => (
                  <tr key={idx} className="divide-x divide-slate-400">
                    <td className="p-2 font-bold uppercase">{sub.name}</td>
                    {sub.quarters.map((q, i) => (
                      <td key={i} className="p-2 text-center">{q?.score || ''}</td>
                    ))}
                    <td className="p-2 text-center font-black">{sub.finalRating || ''}</td>
                    <td className={`p-2 text-center font-black text-[9px] ${sub.action === 'FAILED' ? 'text-rose-600' : ''}`}>{sub.action}</td>
                  </tr>
                ))}
                <tr className="divide-x divide-slate-900 border-t border-slate-900 bg-slate-50 font-black">
                  <td className="p-2 text-right uppercase" colSpan={maxQuarters + 1}>General Average</td>
                  <td className="p-2 text-center text-lg">{sf9Data.genAvg}</td>
                  <td className="p-2 text-center uppercase">{sf9Data.genAvg >= 75 ? 'PASSED' : 'FAILED'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Attendance and Core Values (Placeholder for now) */}
          <div className="space-y-4">
            <h4 className="font-black uppercase italic text-sm border-b-2 border-slate-900 pb-2">Attendance</h4>
            <p className="text-xs text-slate-500">Attendance data not available in current system.</p>
            <h4 className="font-black uppercase italic text-sm border-b-2 border-slate-900 pb-2">Report on Learner's Observed Values</h4>
            <p className="text-xs text-slate-500">Observed values data not available in current system.</p>
          </div>

          <div className="pt-12 grid grid-cols-2 gap-20">
            <div className="text-center border-t border-black pt-2">
              <p className="text-[10px] font-black uppercase">Class Adviser</p>
              <p className="text-sm font-bold">{section?.adviserName || 'N/A'}</p>
            </div>
            <div className="text-center border-t border-black pt-2">
              <p className="text-[10px] font-black uppercase">Date Issued</p>
              <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
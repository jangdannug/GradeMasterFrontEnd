import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Trash2, Table, Eye, Search, Loader2 } from 'lucide-react';
import gradingService from '../services/gradingService';
import { calculateSubjectResult } from '../utils/calculations';
import { theme } from '../theme';

export function ProgressReport({ 
  students, 
  subjects, 
  baseSubjects = [],
  section, 
  transmutationTable, 
  descriptors,
  savedClassRecords = [] 
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredStudents = React.useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 md:space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-6 rounded-2xl border border-slate-200 gap-4">
        <div>
          <h2 className={`text-xl ${theme.styles.heading} text-slate-800`}>Progress Report Cards</h2>
          <p className="text-sm text-slate-500">Summary of all subjects for Section {section.name}</p>
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
          // Only include results from verified (locked) records
          const subjectResults = subjects.map(subject => {
            // Find template for effective categories (fallback logic)
            const template = baseSubjects.find(b => String(b.id) === String(subject.baseSubjectId));
            const effectiveCategories = (subject.categories && subject.categories.length > 0) ? subject.categories : (template?.categories || []);

            const quarterGrades = [1, 2, 3, 4].map(q => {
              const recordId = `${section.id}-${subject.id}-Q${q}`;
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

          const generalAverage = Math.round(subjectResults.reduce((acc, curr) => acc + curr.finalGrade, 0) / (subjects.length || 1));
          const avgDescriptor = descriptors.find(d => generalAverage >= d.min && generalAverage <= d.max) || descriptors[descriptors.length - 1];

          return (
            <div key={student.id} className={`${theme.styles.card} overflow-hidden group`}>
               <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center group-hover:bg-slate-100/50 transition-colors gap-4">
                 <div className="flex items-center gap-4">
                   <div className={`size-12 bg-white ${theme.styles.radiusSm} border border-slate-200 flex items-center justify-center font-black text-slate-400 group-hover:text-${theme.styles.primary} transition-colors shrink-0`}>
                     {student.name.substring(0, 1)}
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-800 uppercase text-sm md:text-base">{student.name}</h4>
                     <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Learner ID: 102938475</p>
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
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                   {subjectResults.map((res, i) => (
                     <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow space-y-4">
                       <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider truncate">{res.name}</p>
                       <div className="grid grid-cols-4 gap-2">
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
                    <button className="px-5 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                      View Detailed Analysis
                    </button>
                 </div>
               </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
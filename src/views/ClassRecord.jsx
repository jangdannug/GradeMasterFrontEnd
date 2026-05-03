
import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trash2, Send, Maximize2, Minimize2, ShieldAlert } from 'lucide-react';
import { calculateSubjectResult } from '../utils/calculations';
import { theme } from '../theme';

function AutoResizeTextarea({ value, onChange, className }) {
  const textareaRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      rows={1}
    />
  );
}

export function ClassRecord({ 
  students, 
  subject, 
  section, 
  transmutationTable,
  descriptors,
  updateGrade, 
  userRole,
  quarter,
  isReadOnly = false,
  savedRecord = null,
  onSubmitClassRecord = null,
  currentUser = null
}) {
  const location = useLocation();
  const isSummaryOnly = location.state?.summaryOnly || false;
  const isAdviser = userRole === 'adviser';
  const isAdmin = userRole === 'admin';
  const isSubmitted = savedRecord?.isLocked;
  const isEditable = !isReadOnly && !isSubmitted;
  const effectiveSummaryOnly = isSummaryOnly || (isAdviser && isReadOnly);
  
  const totalWeight = (subject.categories || []).reduce((acc, cat) => acc + cat.weight, 0);

  const containerRef = React.useRef(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  React.useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${theme.styles.card} ${theme.styles.shadow} overflow-hidden min-w-full border-none ${isFullscreen ? 'h-screen overflow-y-auto bg-white rounded-none' : ''}`}
    >
       <div className={`bg-${theme.styles.primary} text-white p-4 md:p-8`}>
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              <div>
                <div className="flex items-center gap-4">
                  <h2 className={`text-xl md:text-3xl ${theme.styles.heading}`}>Class Record</h2>
                  <button 
                    onClick={toggleFullscreen}
                    className={`flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 ${theme.styles.radiusSm} transition-all active:scale-95 shadow-sm group`}
                    title={isFullscreen ? "Exit Full View" : "Enter Full View"}
                  >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">
                      {isFullscreen ? "Minimize" : "Maximize View"}
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-blue-100 font-medium mt-1 uppercase">DepEd Order 8, s. 2015</p>
              </div>
              <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                <div className="text-left md:text-right text-[10px] space-y-1 text-white/80">
                  <p><span className="opacity-60">REGION:</span> {section.region}</p>
                  <p><span className="opacity-60">DIVISION:</span> {section.division}</p>
                  <p><span className="opacity-60">SCHOOL:</span> {section.schoolName}</p>
                </div>
              </div>
            </div>
          
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-black/10 ${theme.styles.radiusSm}`}>
            <RecordMeta label="Teacher" value={subject.teacherName} />
            <RecordMeta label="Subject" value={subject.name} italic />
            <RecordMeta label="Grade & Section" value={`${section.gradeLevel} - ${section.name}`} />
            <RecordMeta label="Grading Period" value={`${quarter}${quarter === 1 ? 'st' : quarter === 2 ? 'nd' : quarter === 3 ? 'rd' : 'th'} Quarter`} />
            <div className="flex flex-col">
              <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest">Total Weight</p>
              <p className={`font-bold truncate text-sm ${(totalWeight * 100) !== 100 ? 'text-rose-300 animate-pulse' : 'text-blue-100'}`}>
                {Math.round(totalWeight * 100)}% { (totalWeight * 100) !== 100 && '(Target 100%)' }
              </p>
            </div>
          </div>
       </div>

        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse border border-slate-200">
          <thead>
            {/* Category Header */}
            <tr className="bg-slate-100 text-xs font-black text-slate-600 uppercase divide-x divide-slate-300 border-b border-slate-300">
              <th rowSpan={2} className="p-4 text-left w-64 min-w-[250px] sticky left-0 bg-slate-100 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.05)] border-r border-slate-300">LEARNERS' NAMES</th>
              {!effectiveSummaryOnly && (subject.categories || []).map((cat, idx) => {
                const count = cat.columnNames?.length || 5;
                return (
                  <th key={cat.id} colSpan={count + 3} className={`p-4 text-center ${idx % 2 === 0 ? 'bg-blue-100/50' : 'bg-emerald-100/50'}`}>
                    <div className="flex items-center justify-center gap-2">
                        <span className="font-black text-lg text-slate-800 italic uppercase">{cat.name}</span>
                        <span className="opacity-50 whitespace-nowrap text-xs">({Math.round(cat.weight * 100)}%)</span>
                    </div>
                  </th>
                );
              })}
              <th rowSpan={2} className="p-3 w-16 bg-slate-200 text-slate-800 border-l border-slate-300">
                <div className="flex flex-col items-center gap-1">
                  <span>Initial Grade</span>
                  <span className="text-[8px] opacity-50 whitespace-nowrap">(WS TOTAL)</span>
                </div>
              </th>
              <th rowSpan={2} className="p-3 w-16 bg-slate-100 text-slate-700 border-l border-slate-300 font-bold uppercase text-[9px] text-center">Term Grade</th>
              <th rowSpan={2} className="p-3 w-32 bg-slate-100 text-slate-700 border-l border-slate-300 font-bold uppercase text-[9px] text-center">Descriptor</th>
              <th rowSpan={2} className="p-3 w-24 bg-slate-900 text-white sticky right-0 z-30 shadow-[-4px_0_8px_rgba(0,0,0,0.2)] border-l border-slate-700">Quarterly Grade</th>
            </tr>
            {/* Sub-header (1-5, Total, PS, WS) */}
            <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 divide-x divide-slate-200 border-b border-slate-300">
              {!effectiveSummaryOnly && (subject.categories || []).map((cat, idx) => {
                const columnNames = cat.columnNames || Array(5).fill(0).map((_, i) => (i + 1).toString());
                
                return (
                  <React.Fragment key={`sub-${cat.id}`}>
                    {columnNames.map((name, i) => (
                      <th key={`${cat.id}-h-${i}`} className="w-10 min-w-[40px] p-2 text-center font-black text-slate-600">
                        {name}
                      </th>
                    ))}
                    <th className={`w-12 p-1 ${idx % 2 === 0 ? 'bg-blue-50/50' : 'bg-emerald-50/50'}`}>Total</th>
                    <th className={`w-12 p-1 ${idx % 2 === 0 ? 'bg-blue-50/50' : 'bg-emerald-50/50'}`}>PS</th>
                    <th className={`w-12 p-1 ${idx % 2 === 0 ? 'bg-blue-50/50' : 'bg-emerald-50/50'}`}>WS</th>
                  </React.Fragment>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {/* HIGHEST POSSIBLE SCORE ROW */}
            <tr className="bg-slate-900 text-white divide-x divide-slate-700 font-black">
              <td className="p-3 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.1)] border-r border-slate-700 uppercase">
                 {effectiveSummaryOnly ? 'Standard Weights' : 'Highest Possible Score'}
              </td>
              {!effectiveSummaryOnly && (subject.categories || []).map((cat, idx) => {
                const hpsValues = students[0]?.grades?.[subject.id]?.[quarter]?.categoryGrades?.[cat.id]?.hps || [];
                const count = cat.columnNames?.length || 5;

                return (
                  <React.Fragment key={`hps-${cat.id}`}>
                    {Array.from({length: count}).map((_, i) => (
                      <td key={`hps-${cat.id}-${i}`} className="p-0 text-center">
                        <input 
                          type="number"
                          value={hpsValues[i] || ''}
                          onChange={(e) => {
                            if (isEditable) {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              updateGrade('HPS', subject.id, cat.id, 'hps', i, val, quarter);
                            }
                          }}
                          disabled={!isEditable}
                          className={`w-full h-full py-2 px-1 text-center outline-none text-white font-black ${!isEditable ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-transparent focus:bg-slate-800'}`}
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center bg-slate-800">{(hpsValues || []).slice(0, count).reduce((a, b) => a + b, 0)}</td>
                    <td className="p-2 text-center bg-slate-800">100.00</td>
                    <td className="p-0 text-center bg-slate-800">
                      <div className={`p-2 font-black text-xs ${idx % 2 === 0 ? 'bg-blue-900/50 text-blue-100' : 'bg-emerald-900/50 text-emerald-100'}`}>
                        {Math.round(cat.weight * 100)}
                      </div>
                    </td>
                  </React.Fragment>
                );
              })}
              {effectiveSummaryOnly && (subject.categories || []).map((cat, idx) => (
                <td key={`weight-${cat.id}`} className="p-3 text-center bg-slate-800">
                  <div className={`p-1 font-black text-[10px] rounded ${idx % 2 === 0 ? 'bg-blue-900/50 text-blue-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
                    {Math.round(cat.weight * 100)}% {cat.name.split(' ')[0]}
                  </div>
                </td>
              ))}
              <td className="bg-slate-800"></td>
              <td className="bg-slate-800 sticky right-0 z-20"></td>
            </tr>

            {students.map((student, sIdx) => {
              const sg = student.grades[subject.id]?.[quarter];
              const results = calculateSubjectResult(sg, subject, transmutationTable, descriptors);
              
              return (
                <tr key={student.id} className="group hover:bg-indigo-50/40 even:bg-slate-50/50 transition-colors divide-x divide-slate-200">
                  <td className="p-3 sticky left-0 bg-inherit z-10 shadow-[2px_0_4px_rgba(0,0,0,0.02)] border-r border-slate-200">
                    <div className="flex gap-2">
                       <span className="text-[9px] font-bold text-slate-400 w-4">{sIdx + 1}</span>
                       <span className="font-black text-slate-800 uppercase truncate">{student.name}</span>
                    </div>
                  </td>
                  
                  {!effectiveSummaryOnly && (subject.categories || []).map((cat, idx) => {
                    const cg = sg?.categoryGrades?.[cat.id];
                    const catRes = (results.categories || []).find(c => c.categoryId === cat.id) || { total: 0, ps: 0, ws: 0 };
                    const count = cat.columnNames?.length || 5;

                    return (
                      <React.Fragment key={`row-${student.id}-${cat.id}`}>
                        {Array.from({length: count}).map((_, colIdx) => {
                          const hps = cg?.hps[colIdx] ?? 0;
                          return (
                            <td key={`cell-${student.id}-${cat.id}-${colIdx}`} className="p-0">
                              <input 
                                type="number"
                                min="0"
                                max={hps}
                                value={cg?.scores[colIdx]?.points ?? ''}
                                onChange={(e) => {
                                  if (isEditable) {
                                    const val = e.target.value === '' ? null : parseInt(e.target.value);
                                    updateGrade(student.id, subject.id, cat.id, 'points', colIdx, val, quarter);
                                  }
                                }}
                                className={`w-full h-full py-2 px-1 text-center outline-none text-slate-900 font-bold ${hps === 0 || !isEditable ? 'bg-slate-100/50 cursor-not-allowed opacity-50' : 'bg-white/40 focus:bg-white focus:ring-1 focus:ring-inset focus:ring-indigo-500'}`}
                                disabled={hps === 0 || !isEditable}
                              />
                            </td>
                          );
                        })}
                        <td className={`p-2 text-center font-bold text-slate-800 ${idx % 2 === 0 ? 'bg-blue-50/30' : 'bg-emerald-50/30'}`}>{catRes.total}</td>
                        <td className={`p-2 text-center font-bold ${idx % 2 === 0 ? 'text-blue-600 bg-blue-50/40' : 'text-emerald-600 bg-emerald-50/40'}`}>{catRes.ps.toFixed(2)}</td>
                        <td className={`p-2 text-center font-black ${idx % 2 === 0 ? 'text-blue-700 bg-blue-100/30' : 'text-emerald-700 bg-emerald-100/30'}`}>{catRes.ws.toFixed(2)}</td>
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Final results */}
                  <td className="p-2 text-center font-black bg-slate-100 text-slate-800">{results.initial.toFixed(2)}</td>
                  <td className="p-2 text-center font-bold bg-slate-50 text-slate-600 border-l border-slate-200">{results.quarterly}</td>
                  <td className={`p-2 text-center font-black bg-slate-50 border-l border-slate-200 text-[10px] uppercase italic ${results.descriptor.color}`}>
                    {results.descriptor.label}
                  </td>
                  <td className="p-3 bg-slate-900 text-white sticky right-0 z-20 shadow-[-4px_0_10px_rgba(0,0,0,0.2)]">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-base font-black leading-none">{results.quarterly}</span>
                      <span className={`text-[7px] font-black uppercase tracking-[0.2em] opacity-90 brightness-150 ${results.descriptor.color}`}>
                        {results.descriptor.label}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
       </div>

       {!isReadOnly && !isSubmitted && onSubmitClassRecord && (
         <div className="p-6 md:p-10 bg-slate-50 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
           <div className="flex items-center gap-5 p-5 bg-rose-50 border-2 border-rose-100 rounded-[2rem] shadow-sm max-w-2xl">
             <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm shrink-0 border border-rose-50">
               <ShieldAlert size={28} />
             </div>
             <div className="space-y-1">
               <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Submission Notice</p>
               <p className="text-sm font-black text-rose-900 uppercase italic leading-tight">
                 Once submitted, this record will be locked and cannot be edited without approval from the adviser.
               </p>
             </div>
           </div>
           <button
             onClick={() => {
               if (confirm('Are you sure you want to submit this class record? Once submitted, it cannot be edited unless the adviser approves an edit request.')) {
                 onSubmitClassRecord({
                   subject,
                   section,
                   teacher: currentUser,
                   students
                 });
               }
             }}
             className={`${theme.styles.button} bg-emerald-500 hover:bg-emerald-600 text-white py-4`}
           >
             <Send size={18} />
             Submit Record
           </button>
         </div>
       )}

       {isSubmitted && (
         <div className="p-4 md:p-8 bg-amber-50 border-t border-amber-200 flex items-center gap-3">
           <div className="text-2xl">🔒</div>
           <div>
             <p className="font-bold text-amber-900">Record Submitted & Locked</p>
             <p className="text-sm text-amber-800">
               Submitted on {new Date(savedRecord.submittedAt).toLocaleDateString()}.
             </p>
           </div>
         </div>
       )}

    </motion.div>
  );
}

function RecordMeta({ label, value, italic }) {
  return (
    <div className="overflow-hidden">
      <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest">{label}</p>
      <p className={`font-black text-base uppercase`}>{value}</p>
    </div>
  );
}
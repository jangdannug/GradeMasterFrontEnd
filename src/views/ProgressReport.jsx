import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Trash2, Table, Eye, Search, Loader2, FileText, X, Printer, Files } from 'lucide-react';
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
  const [activeTab, setActiveTab] = React.useState('cards'); // 'cards' | 'summary'

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

  // Centralized calculation logic for all students to be shared between tabs
  const studentReportData = React.useMemo(() => {
    return filteredStudents.map(student => {
      const studentSubjects = subjects.filter(sub => String(sub.sectionId) === String(student.sectionId));
      
      const subjectResults = studentSubjects.flatMap(subject => { // Use flatMap to handle composite subjects
        const template = baseSubjects.find(b => String(b.id) === String(subject.baseSubjectId));
        // Ensure calculateSubjectResult receives the full subject object with resolved categories
        const subjectWithResolvedCategories = { 
          ...subject, 
          categories: (subject.categories && subject.categories.length > 0) ? subject.categories : (template?.categories || []) 
        };

        const mainSubjectQuarterlyResults = Array.from({ length: maxQuarters }, (_, i) => i + 1).map(q => {
          const recordId = `${student.sectionId}-${subject.id}-Q${q}`;
          const verifiedRecord = savedClassRecords.find(r => r.id === recordId && r.isVerified);
          
          if (!verifiedRecord) return { quarter: q, score: null };

          const snapshot = verifiedRecord.studentSnapshots?.find(s => String(s.id) === String(student.id));
          const result = calculateSubjectResult(snapshot?.grades, subjectWithResolvedCategories, transmutationTable, descriptors);
          
          return { quarter: q, score: result.quarterly, descriptor: result.descriptor, components: result.components };
        });

        const isComposite = subjectWithResolvedCategories.categories?.some(c => c.isComponent);
        const componentsList = isComposite ? subjectWithResolvedCategories.categories : [];

        const verifiedScores = mainSubjectQuarterlyResults.filter(q => q.score !== null).map(q => q.score);
        const finalGrade = verifiedScores.length > 0 
          ? Math.round(verifiedScores.reduce((a, b) => a + b, 0) / verifiedScores.length) 
          : 0;
        
        const finalDescriptor = descriptors.find(d => finalGrade >= d.min && finalGrade <= d.max) || descriptors[descriptors.length - 1];

        const results = [{
          id: subject.id,
          name: subject.name,
          quarterlyGrades: mainSubjectQuarterlyResults,
          finalGrade,
          finalDescriptor,
          isVerified: verifiedScores.length > 0,
          isComposite,
          components: componentsList
        }];

        // If composite, also add each component as a separate entry for SF9/SF10
        if (isComposite) {
          componentsList.forEach(comp => {
            const compVerifiedScores = mainSubjectQuarterlyResults.filter(q => q.components?.find(c => c.id === comp.id)?.quarterly > 0).map(q => q.components?.find(c => c.id === comp.id)?.quarterly);
            const compFinalGrade = compVerifiedScores.length > 0
              ? Math.round(compVerifiedScores.reduce((a, b) => a + b, 0) / compVerifiedScores.length)
              : 0;
            const compFinalDescriptor = descriptors.find(d => compFinalGrade >= d.min && compFinalGrade <= d.max) || descriptors[descriptors.length - 1];

            results.push({
              id: comp.id, // Use component ID
              name: `  ${comp.name}`, // Indent for sub-subject
              quarterlyGrades: mainSubjectQuarterlyResults.map(q => ({
                quarter: q.quarter,
                score: q.components?.find(c => c.id === comp.id)?.quarterly,
                descriptor: q.components?.find(c => c.id === comp.id)?.descriptor
              })),
              finalGrade: compFinalGrade,
              finalDescriptor: compFinalDescriptor,
              isVerified: compVerifiedScores.length > 0,
              isComponent: true,
              parentSubjectId: subject.id
            });
          });
        }
        return results;
      });

      // Filter out component results when calculating general average
      const nonComponentSubjectResults = subjectResults.filter(res => !res.isComponent);

      const generalAverage = nonComponentSubjectResults.length > 0 
        ? Math.round(nonComponentSubjectResults.reduce((acc, curr) => acc + curr.finalGrade, 0) / nonComponentSubjectResults.length)
        : 0;
      const avgDescriptor = descriptors.find(d => generalAverage >= d.min && generalAverage <= d.max) || descriptors[descriptors.length - 1];

      return { student, subjectResults, generalAverage, avgDescriptor }; // Pass all results, we filter in the UI
    });
  }, [filteredStudents, subjects, baseSubjects, maxQuarters, savedClassRecords, transmutationTable, descriptors]);

  // Flattened subjects list for Grade Summary table columns
  const summarySubjectsList = React.useMemo(() => {
    return subjects.flatMap(sub => {
      const template = baseSubjects.find(b => String(b.id) === String(sub.baseSubjectId));
      const cats = (sub.categories && sub.categories.length > 0) ? sub.categories : (template?.categories || []);
      const isComp = cats.some(c => c.isComponent);
      const result = [{ ...sub, isComposite: isComp }];
      if (isComp) {
        cats.forEach(comp => result.push({ ...comp, isComponent: true, parentId: sub.id }));
      }
      return result;
    });
  }, [subjects, baseSubjects]);

  const handleDownloadSummary = React.useCallback(() => {
    if (!studentReportData || studentReportData.length === 0) {
      alert("No data to download.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";

    // Headers
    let headers = ["No.", "Learner's Name"];
    
    const subjectsForSummary = summarySubjectsList;
    subjectsForSummary.forEach(sub => {
      const subjectLabel = `${sub.name} (G${section?.gradeLevel || 'N/A'})`; // Use section gradeLevel or N/A
      for (let q = 1; q <= maxQuarters; q++) {
        headers.push(`${subjectLabel} Q${q}`);
      }
      headers.push(`${subjectLabel} Final`);
    });
    headers.push("General Average");
    csvContent += headers.join(",") + "\n";

    // Data Rows
    studentReportData.forEach(({ student, subjectResults, generalAverage }, sIdx) => {
      let row = [`"${sIdx + 1}"`, `"${student.name}"`];
      
      summarySubjectsList.forEach(sub => {
        const subRes = subjectResults.find(r => r.id === sub.id);
        for (let q = 1; q <= maxQuarters; q++) {
          const qRes = subRes.quarterlyGrades.find(item => item.quarter === q);
          row.push(`"${qRes?.score || ''}"`);
        }
        row.push(`"${subRes.finalGrade || ''}"`);
      });
      row.push(`"${generalAverage || ''}"`);
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = section 
      ? `Grade_Summary_${section.gradeLevel}-${section.name}.csv` 
      : `Grade_Summary_All_Sections.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [studentReportData, maxQuarters, section, summarySubjectsList]); // Dependencies for useCallback

  const handleBulkPrint = (type) => {
    const path = type === 'sf9' ? '/sf9' : '/sf10';
    const dataKey = type === 'sf9' ? 'reportData' : 'sf10Data';
    
    const studentsData = studentReportData.map(({ student, subjectResults, generalAverage }) => ({
      student,
      [dataKey]: {
        subjectGrades: subjectResults || [],
        genAvg: generalAverage || 0
      },
      section: allSections.find(s => String(s.id) === String(student.sectionId))
    }));

    navigate(path, { state: { isBulk: true, studentsData } });
  };

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
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit shadow-sm">
          <TabButton 
            active={activeTab === 'cards'} 
            onClick={() => setActiveTab('cards')}
            icon={<Table size={14} />}
            label="Individual Cards"
          />
          <TabButton 
            active={activeTab === 'summary'} 
            onClick={() => setActiveTab('summary')}
            icon={<Eye size={14} />}
            label="Grade Summary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {studentReportData.length > 0 && (
            <>
              <button 
                onClick={() => handleBulkPrint('sf9')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
              >
                <Printer size={14} /> Print All SF9
              </button>
              <button 
                onClick={() => handleBulkPrint('sf10')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                <Printer size={14} /> Print All SF10
              </button>
            </>
          )}
          <button 
            onClick={handleDownloadSummary}
            disabled={activeTab === 'cards'}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'cards' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-black shadow-lg'}`}
          >
            <Download size={14} /> Summary CSV
          </button>
        </div>
      </div>

      {/* AnimatePresence for tab content (cards vs summary) */}
      <AnimatePresence mode="wait">
        {activeTab === 'cards' ? (
          <motion.div 
            key="cards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            {studentReportData.map(({ student, subjectResults, generalAverage, avgDescriptor }) => (
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
                     {subjectResults.filter(r => !r.isComponent).map((res, i) => (
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

                         {/* Composite Subject Components Breakdown */}
                         {res.isComposite && (
                           <div className="pt-3 border-t border-slate-50 space-y-1">
                             {res.components.map(comp => (
                               <div key={comp.id} className="flex items-center justify-between text-[7px] font-black text-slate-400 uppercase tracking-tighter">
                                 <span className="truncate max-w-[60px]">{comp.name}</span>
                                 <div className="flex gap-1">
                                   {res.quarterlyGrades.map(q => {
                                     const compScore = q.components?.find(c => c.id === comp.id)?.quarterly;
                                     return <span key={q.quarter} className={`w-4 text-center ${compScore ? 'text-slate-600' : 'text-slate-200'}`}>{compScore || '-'}</span>
                                   })}
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}

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
                        onClick={() => {
                          navigate('/sf10', { state: { 
                            student, 
                            sf10Data: {
                              subjectGrades: subjectResults || [],
                              genAvg: generalAverage || 0
                            }, 
                            section: allSections.find(s => String(s.id) === String(student.sectionId)) 
                          }});
                        }}
                        className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
                      >
                        <FileText size={14} /> SF10 Permanent Record
                      </button>
                      <button
                        onClick={() => {
                          navigate('/sf9', { state: { 
                            student, 
                            reportData: {
                              subjectGrades: subjectResults || [],
                              genAvg: generalAverage || 0
                            }, 
                            section: allSections.find(s => String(s.id) === String(student.sectionId)) 
                          }});
                        }}
                        className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-100"
                      >
                        <FileText size={14} /> SF9 Progress Report
                      </button>
                   </div>
                 </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th rowSpan={2} className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-12">No.</th>
                    <th rowSpan={2} className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[200px] sticky left-0 bg-slate-50 z-10 border-r">Learner's Name</th>
                    {summarySubjectsList.map(sub => (
                      <th key={sub.id} colSpan={maxQuarters + 1} className={`p-2 text-center text-[10px] font-black uppercase tracking-widest border-r border-slate-200 ${sub.isComponent ? 'bg-slate-50 text-indigo-400 text-[8px]' : 'bg-slate-100 text-slate-600'}`}>
                        <div className="flex flex-col items-center">
                          {sub.isComponent && <span className="text-[6px] opacity-50 block mb-0.5 tracking-tighter">↳ Component</span>}
                          {sub.name}
                        </div>
                      </th>
                    ))}
                    <th rowSpan={2} className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 w-24 border-l border-indigo-100">Gen. Avg</th>
                  </tr>
                  <tr className="bg-slate-50/30 border-b border-slate-200">
                    {summarySubjectsList.map(sub => (
                      <React.Fragment key={`sub-header-${sub.id}`}>
                        {Array.from({ length: maxQuarters }, (_, i) => (
                          <th key={i} className="p-2 text-center text-[8px] font-black text-slate-400 border-r border-slate-100">Q{i + 1}</th>
                        ))}
                        <th className="p-2 text-center text-[8px] font-black text-indigo-500 bg-indigo-50/30 border-r border-slate-200 italic">Final</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentReportData.map(({ student, subjectResults, generalAverage }, sIdx) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 text-xs font-bold text-slate-400">{sIdx + 1}</td>
                      <td className="p-4 text-sm font-black text-slate-800 uppercase sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r">
                        {student.name}
                      </td>
                      {summarySubjectsList.map(sub => {
                        const res = subjectResults.find(r => r.id === sub.id);
                        return (
                          <React.Fragment key={`res-${student.id}-${sub.id}`}>
                            {Array.from({ length: maxQuarters }, (_, i) => {
                              const qRes = res?.quarterlyGrades.find(q => q.quarter === i + 1);
                              return (
                                <td key={i} className="p-2 text-center text-xs font-medium text-slate-600 border-r border-slate-100">
                                  {qRes?.score || <span className="text-slate-200">--</span>}
                                </td>
                              );
                            })}
                            <td className={`p-2 text-center text-xs font-black border-r border-slate-200 ${sub.isComponent ? 'bg-slate-50/50 text-slate-400' : 'bg-indigo-50/20'}`}>
                              {res ? (
                                <span className={res.finalGrade < 75 ? 'text-rose-500' : 'text-indigo-600'}>
                                  {res.finalGrade || '--'}
                                </span>
                              ) : (
                                <span className="text-slate-200">--</span>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="p-4 text-center text-base font-black text-indigo-600 bg-indigo-50/30 border-l border-indigo-100">
                        {generalAverage || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
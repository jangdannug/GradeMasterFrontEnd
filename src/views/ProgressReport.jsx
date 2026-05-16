import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Trash2, Table, Eye, Search, Loader2, FileText, X, Printer, Files, BookOpen, Layers } from 'lucide-react';
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

  // Helper function to parse the full name into its components
  const parseFullName = (fullName) => {
    const parts = fullName.split(',');
    let lastName = '';
    let firstName = '';
    let middleName = '';

    if (parts.length >= 2) {
      lastName = parts[0].trim();
      const names = parts[1].trim().split(/\s+/);
      if (names.length > 1) {
        middleName = names.pop();
        firstName = names.join(' ');
      } else {
        firstName = names[0] || '';
      }
    } else {
      const names = fullName.trim().split(/\s+/);
      if (names.length >= 3) {
        lastName = names[0];
        middleName = names.pop();
        firstName = names.slice(1).join(' ');
      } else if (names.length === 2) {
        lastName = names[0];
        firstName = names[1];
      } else {
        lastName = fullName;
      }
    }
    return { lastName, firstName, middleName };
  };

  const getStudentInitials = (fullName) => {
    const parts = fullName.split(',');
    let lastNameInitial = ''; // Initial for Last Name
    let firstNameInitial = ''; // Initial for First Name
    let middleNameInitial = ''; // Initial for Middle Name

    if (parts.length >= 2) {
      // Format: LastName, FirstName MiddleName
      const lastName = parts[0].trim();
      const firstNameAndMiddleNameParts = parts[1].trim().split(' ');
      const firstName = firstNameAndMiddleNameParts[0].trim();
      
      if (lastName) lastNameInitial = lastName[0];
      if (firstName) firstNameInitial = firstName[0];
      
      // If there are more than one part after the comma, assume the last one is the middle name
      if (firstNameAndMiddleNameParts.length > 1) {
        middleNameInitial = firstNameAndMiddleNameParts[firstNameAndMiddleNameParts.length - 1][0].trim();
      }

    } else {
      // Assume format: LastName FirstName MiddleName (if no comma)
      const nameParts = fullName.trim().split(' ');
      if (nameParts.length >= 3) {
        lastNameInitial = nameParts[0][0];
        firstNameInitial = nameParts[1][0];
        middleNameInitial = nameParts[nameParts.length - 1][0];
      } else if (nameParts.length === 2) {
        lastNameInitial = nameParts[0][0];
        firstNameInitial = nameParts[1][0];
      } else if (nameParts.length === 1 && nameParts[0].length > 0) {
        // Only one word, use its first two letters if available
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }
    
    let initials = `${lastNameInitial}${firstNameInitial}`;
    if (middleNameInitial) {
      initials += middleNameInitial;
    }

    // Fallback if no initials could be determined
    if (!lastNameInitial && !firstNameInitial && !middleNameInitial) {
      return fullName.substring(0, 2).toUpperCase();
    }
    
    return initials.toUpperCase();
  };

  const filteredStudents = React.useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.lrn).includes(searchQuery) // Include LRN in search
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

  // NEW: Animation Variants
  const cardContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardItemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    show: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };

  const getHonorStatus = (avg) => {
    if (avg >= 98) return { label: 'With Highest Honors', color: 'bg-amber-500 text-white shadow-amber-200' };
    if (avg >= 95) return { label: 'With High Honors', color: 'bg-indigo-600 text-white shadow-indigo-200' };
    if (avg >= 90) return { label: 'With Honors', color: 'bg-emerald-500 text-white shadow-emerald-200' };
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 md:space-y-8"
    >
      <div className={`flex flex-col sm:flex-row justify-between sm:items-center p-6 ${theme.styles.card} gap-4`}>
        <div>
          <h2 className={`text-xl ${theme.styles.heading} text-slate-800`}>Progress Report Cards</h2>
          <p className="text-sm text-slate-500">
            {section ? `Summary of all subjects for Section ${section.name}` : "Global Student Progress Overview"}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search student name or LRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${theme.styles.input} !bg-white/50 !border-white/60 pl-10 py-2.5 text-sm`}
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
            {studentReportData.map(({ student, subjectResults, generalAverage, avgDescriptor }) => ( // Individual Student Cards
              <div key={student.id} className="bg-slate-50 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden group transition-all duration-300 relative">
                 {/* Honor Ribbon */}
                 {getHonorStatus(generalAverage) && (
                   <div className={`absolute top-0 right-10 px-4 py-1.5 rounded-b-xl text-[10px] font-black uppercase tracking-widest z-10 shadow-lg ${getHonorStatus(generalAverage).color}`}>
                     {getHonorStatus(generalAverage).label}
                   </div>
                 )}

                 <div className="p-6 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center group-hover:bg-white transition-colors gap-4">
                   <div className="flex items-center gap-4">
                     <div className={`size-16 rounded-[1.5rem] flex items-center justify-center text-lg font-black shadow-lg border-4 border-white ${student.gender === 'MALE' ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-rose-500 text-white shadow-rose-100'} shrink-0 transition-transform group-hover:scale-110 duration-500`}>
                       {getStudentInitials(student.name)}
                     </div>
                     <div className="min-w-0 flex-1">
                       {(() => {
                         const { lastName, firstName, middleName } = parseFullName(student.name);
                         return (
                           <div className="flex flex-col">
                             <h4 className="font-black text-slate-800 uppercase text-base md:text-xl whitespace-normal break-words tracking-tight leading-tight">
                               <span className="text-indigo-600" title="Last Name">{lastName}</span>
                               {firstName && <>, <span className="text-slate-700" title="First Name">{firstName}</span></>}
                               {middleName && <span className="text-slate-400 ml-2" title="Middle Name">{middleName}</span>}
                             </h4>
                             <p className="text-[11px] text-slate-500 font-black tracking-[0.2em] uppercase mt-1">
                               {allSections.find(sec => String(sec.id) === String(student.sectionId))?.name || 'Unassigned'} • LRN: {student.lrn}
                             </p>
                           </div>
                         );
                       })()}
                     </div>
                   </div>
                   <div className="text-left sm:text-right flex items-center gap-6">
                     <div className="h-12 w-px bg-slate-200 hidden sm:block"></div>
                     <div>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">General Average</p>
                       <div className="flex items-baseline gap-2 sm:justify-end">
                         <p className={`text-4xl md:text-5xl font-black leading-none tracking-tighter ${generalAverage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {generalAverage}
                         </p>
                         <p className={`text-[11px] font-black uppercase tracking-widest ${avgDescriptor?.color}`}>
                           {avgDescriptor?.label}
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="p-6 md:p-8 bg-slate-200/30">
                   <motion.div variants={cardContainerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                     {subjectResults.filter(r => !r.isComponent).map((res, i) => (
                       <motion.div variants={cardItemVariants} key={i} className="group/sub p-6 rounded-[2.5rem] border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-[1.3] origin-center hover:z-20 hover:brightness-110 transition-all duration-300 flex flex-col justify-between space-y-5 relative overflow-hidden shadow-md">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-400 opacity-0 group-hover/sub:opacity-100 transition-opacity" />
                         
                         <div className="space-y-4">
                           <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-2 min-w-0">
                               <div className="size-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                                 <BookOpen size={14} />
                               </div>
                               <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{res.name}</p>
                             </div>
                             {res.isVerified && (
                               <span className="shrink-0 text-[8px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">Verified</span>
                             )}
                           </div>

                           <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${maxQuarters}, minmax(0, 1fr))` }}>
                             {res.quarterlyGrades.map(q => (
                               <div key={q.quarter} className={`text-center py-2 rounded-xl border transition-all ${q.score === null ? 'border-dashed border-slate-200 bg-transparent' : 'bg-white border-slate-100 shadow-sm'}`}>
                                 <p className="text-[7px] text-slate-600 font-black uppercase mb-1">Q{q.quarter}</p>
                                 <p className={`text-sm font-black leading-none ${q.score === null ? 'text-slate-400' : q.score < 75 ? 'text-rose-500' : 'text-slate-800'}`}>
                                   {q.score || '--'}
                                 </p>
                                 {q.score !== null && (
                                   <p className={`text-[6px] font-black uppercase mt-1.5 leading-none px-1 py-0.5 rounded-sm inline-block ${q.descriptor?.color?.replace('text-', 'bg-').replace('600', '50')} ${q.descriptor?.color}`}>
                                     {q.descriptor?.label.substring(0, 3)}
                                   </p>
                                 )}
                               </div>
                             ))}
                           </div>

                           {/* Composite Subject Components Breakdown */}
                           {res.isComposite && (
                             <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                               <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-1 flex items-center gap-1">
                                 <Layers size={10} /> Component Breakdown
                               </p>
                               <div className="space-y-1.5">
                                 {res.components.map(comp => (
                                   <div key={comp.id} className="flex items-center justify-between text-[8px] font-bold text-slate-700 uppercase tracking-tight">
                                     <span className="truncate max-w-[80px]">{comp.name}</span>
                                     <div className="flex gap-1">
                                       {res.quarterlyGrades.map(q => {
                                         const compScore = q.components?.find(c => c.id === comp.id)?.quarterly; // Check if compScore is defined
                                         return <span key={q.quarter} className={`w-5 text-center font-black ${compScore ? 'text-indigo-600' : 'text-slate-400'}`}>{compScore || '-'}</span>
                                       })}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                         </div>

                         <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Yearly Grade</span>
                             {res.isVerified && (
                               <span className={`text-[9px] font-black uppercase tracking-tight mt-1 ${res.finalDescriptor?.color}`}>
                                 {res.finalDescriptor?.label}
                               </span>
                             )}
                           </div>
                           <div className={`size-12 rounded-2xl flex items-center justify-center border-2 ${res.finalGrade >= 75 ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-lg shadow-emerald-500/10' : 'bg-rose-50 border-rose-200 text-rose-600 shadow-lg shadow-rose-500/10'}`}>
                              <span className="text-xl font-black">{res.finalGrade || '--'}</span>
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </motion.div>

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
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th rowSpan={2} className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 w-12">No.</th>
                    <th rowSpan={2} className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-800 min-w-[250px] sticky left-0 bg-slate-100 z-30 border-r border-slate-300 shadow-md">Learner's Name</th>
                    {summarySubjectsList.map(sub => (
                      <th key={sub.id} colSpan={maxQuarters + 1} className={`p-3 text-center text-[10px] font-black uppercase tracking-widest border-r border-slate-300 ${sub.isComponent ? 'bg-slate-50 text-indigo-500 text-[9px]' : 'bg-indigo-50 text-indigo-900'}`}>
                        <div className="flex flex-col items-center">
                          {sub.isComponent && <span className="text-[6px] opacity-50 block mb-0.5 tracking-tighter">↳ Component</span>}
                          {sub.name}
                        </div>
                      </th>
                    ))}
                    <th rowSpan={2} className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 w-24 sticky right-0 z-30 shadow-[-4px_0_10px_rgba(0,0,0,0.1)]">Gen. Avg</th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {summarySubjectsList.map(sub => (
                      <React.Fragment key={`sub-header-${sub.id}`}>
                        {Array.from({ length: maxQuarters }, (_, i) => (
                          <th key={i} className="p-2 text-center text-[8px] font-black text-slate-500 border-r border-slate-100">Q{i + 1}</th>
                        ))}
                        <th className="p-2 text-center text-[8px] font-black text-indigo-500 bg-indigo-50/30 border-r border-slate-200 italic">Final</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentReportData.map(({ student, subjectResults, generalAverage, avgDescriptor }, sIdx) => (
                    <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group even:bg-slate-50/50">
                      <td className="p-4 text-xs font-bold text-slate-500">{sIdx + 1}</td>
                      <td className="p-4 text-sm font-black text-slate-800 uppercase sticky left-0 bg-inherit group-hover:bg-indigo-50 z-10 border-r border-slate-200 shadow-sm">
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
                            <td className={`p-2 text-center text-xs font-black border-r border-slate-200 ${sub.isComponent ? 'bg-slate-50/30 text-slate-400' : 'bg-gradient-to-b from-indigo-50/30 to-indigo-100/30'}`}>
                              {res ? (
                                <span className={res.finalGrade < 75 ? 'text-rose-600' : 'text-indigo-700'}>
                                  {res.finalGrade || '--'}
                                </span>
                              ) : (
                                <span className="text-slate-200">--</span>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="p-4 text-center sticky right-0 z-10 bg-slate-900 text-white shadow-[-4px_0_15px_rgba(0,0,0,0.2)]">
                        <div className="flex flex-col">
                          <span className="text-lg font-black leading-none">{generalAverage || '--'}</span>
                          <span className={`text-[7px] font-black uppercase tracking-tighter mt-1 ${avgDescriptor?.color.replace('text-', 'text-opacity-80 text-')}`}>{avgDescriptor?.label.split(' ')[0]}</span>
                        </div>
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
          : 'text-slate-600 hover:text-indigo-700 hover:bg-white/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
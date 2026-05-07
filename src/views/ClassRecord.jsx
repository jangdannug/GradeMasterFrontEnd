
import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react'; // Keep this line
import { Trash2, Send, Maximize2, Minimize2, ShieldAlert, Loader2, Save, Layers } from 'lucide-react';
import gradingService from '../services/gradingService';
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
  baseSubjects = [],
  section, 
  transmutationTable,
  descriptors,
  updateGrade, 
  saveDraftClassRecord,
  loadClassRecordDraft,
  applyClassRecordDraft,
  userRole,
  quarter,
  isReadOnly = false,
  savedRecord = null,
  onSubmitClassRecord = null,
  currentUser = null,
  onRefresh = null,
  onDirtyChange = null
}) {
  const location = useLocation();
  const isSummaryOnly = location.state?.summaryOnly || false;
  const isAdviser = userRole === 'adviser';
  const isAdmin = userRole === 'admin';
  const isSubmitted = savedRecord?.isLocked;
  const isVerified = savedRecord?.isVerified; // New variable for clarity
  const isEditable = !isReadOnly && !isSubmitted && !isVerified; // Record is editable only if not read-only, not locked, and not verified.
  const effectiveSummaryOnly = isSummaryOnly || (isAdviser && isReadOnly);

  // Find the template associated with this subject to ensure we have the categories
  const template = React.useMemo(() => 
    baseSubjects.find(b => String(b.id) === String(subject.baseSubjectId)), 
    [baseSubjects, subject.baseSubjectId]
  );

  // Unified categories (instance or template fallback)
  const resolvedCategories = React.useMemo(() => 
    (subject.categories && subject.categories.length > 0) ? subject.categories : (template?.categories || []),
    [subject.categories, template]
  );

  const isComposite = React.useMemo(() => 
    resolvedCategories.some(c => c.isComponent), 
    [resolvedCategories]);

  const [activeComponentId, setActiveComponentId] = React.useState(null);

  // Sync activeComponentId when the subject or composite status changes
  React.useEffect(() => {
    if (isComposite && resolvedCategories.length > 0) {
      setActiveComponentId(resolvedCategories[0].id);
    } else {
      setActiveComponentId(null);
    }
  }, [subject.id, isComposite, resolvedCategories]);

  const effectiveCategories = React.useMemo(() => {
    if (activeComponentId === 'summary') return [];
    if (isComposite && activeComponentId) {
      const foundComponent = resolvedCategories.find(c => c.id === activeComponentId);
      // If activeComponentId is set but the component is not found (e.g., deleted),
      // fall back to the first component's categories if available.
      return foundComponent?.categories || resolvedCategories[0]?.categories || [];
    }
    return resolvedCategories;
  }, [resolvedCategories, isComposite, activeComponentId]);

  const totalWeight = (effectiveCategories).reduce((acc, cat) => acc + cat.weight, 0);

  const containerRef = React.useRef(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [calculatedGrades, setCalculatedGrades] = React.useState({});
  const [calculatingGrades, setCalculatingGrades] = React.useState(false);
  const [draftStatus, setDraftStatus] = React.useState('saved');
  const [isApplyingDraft, setIsApplyingDraft] = React.useState(false);
  const latestStudentsRef = React.useRef(students); // Ref to hold the latest students prop for event handlers
  const [draftLoaded, setDraftLoaded] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const initialStudentsRef = React.useRef(null); // Will store stringified students after load/save
  const hasInitialBatchCalculated = React.useRef(false);

  // Reset draft loaded status when subject, section, or quarter changes
  React.useEffect(() => {
    setDraftLoaded(false);
    setIsApplyingDraft(false);
    hasInitialBatchCalculated.current = false;
    initialStudentsRef.current = null; // Clear the ref to force re-initialization on next load
    setHasUnsavedChanges(false); // No unsaved changes when changing context
    onDirtyChange?.(false);
  }, [subject?.id, section?.id, quarter]);

  // Reset dirty status when the component unmounts
  React.useEffect(() => {
    return () => {
      onDirtyChange?.(false);
    };
  }, [onDirtyChange]);

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

  React.useEffect(() => {
    if (!subject || !section || !students.length || draftLoaded) return;

    const recordId = `${section.id}-${subject.id}-Q${quarter}`;
    const loadDraft = async () => {
        const draft = await loadClassRecordDraft(recordId);
        // Populate data if a draft or submitted record exists
        if (draft && draft.studentSnapshots?.length > 0) {
            setIsApplyingDraft(true); // Flag that we are waiting for the parent to update students prop
            applyClassRecordDraft(draft, subject.id, quarter);
        }
        setDraftLoaded(true);
    };

    loadDraft();
  }, [subject, section, quarter, students.length, loadClassRecordDraft, applyClassRecordDraft, draftLoaded]);

  // Effect to detect unsaved changes
  React.useEffect(() => {
    // When draft is loaded for the first time for this subject/quarter,
    // or when subject/section/quarter changes and draftLoaded becomes true,
    // capture the current students state as the baseline.
    if (draftLoaded && (initialStudentsRef.current === null || isApplyingDraft)) {
      // If we just applied a draft, wait for students prop to change before setting baseline
      initialStudentsRef.current = JSON.stringify(students);
      setIsApplyingDraft(false); 
      setHasUnsavedChanges(false);
      onDirtyChange?.(false);
    } else if (draftLoaded && !isApplyingDraft) { // Only check for changes if draft is fully loaded and baseline set
      const currentStudentsString = JSON.stringify(students);
      const isDirty = currentStudentsString !== initialStudentsRef.current;
      setHasUnsavedChanges(isDirty);
      onDirtyChange?.(isDirty);
    }
  }, [students, draftLoaded, onDirtyChange, isApplyingDraft]);

  // Update the ref whenever students prop changes
  React.useEffect(() => {
    latestStudentsRef.current = students;
  }, [students]);
  
  // Effect to warn user about unsaved changes on page unload
  React.useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        // Standard way to trigger browser's native confirmation dialog
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome to show the prompt
        return ''; // Required for Firefox to show the prompt
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]); // Re-run effect if hasUnsavedChanges changes

  const handleSaveDraft = React.useCallback(async () => {
    if (!isEditable || !saveDraftClassRecord || !currentUser || !subject || !section || draftStatus === 'saving' || !hasUnsavedChanges) return;
    
    setDraftStatus('saving');
    const relevantStudents = students.filter(s => String(s.sectionId) === String(subject.sectionId));
    try {
      const result = await saveDraftClassRecord({ subject, section, teacher: currentUser, students: relevantStudents, quarter });
      if (result.success) {
        setDraftStatus('saved');
        initialStudentsRef.current = JSON.stringify(students); // Update saved state
        setHasUnsavedChanges(false); // Reset unsaved changes
        onDirtyChange?.(false);
      } else {
        setDraftStatus('error');
      }
    } catch (error) {
      setDraftStatus('error');
    }
  }, [isEditable, saveDraftClassRecord, currentUser, subject, section, students, quarter, draftStatus, hasUnsavedChanges, onDirtyChange]);

  // Handle Grade Calculations
  React.useEffect(() => {
    if (!students.length || !subject) return;

    // 1. ALWAYS perform immediate local calculation so the UI updates instantly
    const localGrades = {};
    students.forEach(student => {
      const sg = student.grades?.[subject.id]?.[quarter];
      // Ensure calculation uses resolved categories
      localGrades[student.id] = calculateSubjectResult(sg, { ...subject, categories: resolvedCategories }, transmutationTable, descriptors);
    });

    // 2. If the draft just finished loading, sync once with the API to ensure 100% accuracy
    if (draftLoaded && !hasInitialBatchCalculated.current) {
      hasInitialBatchCalculated.current = true;
      setCalculatingGrades(true);
      
      const syncWithApi = async () => {
        try {
        const batchData = students.map(student => ({
          studentId: student.id,
          grades: student.grades?.[subject.id]?.[quarter] || null,
          categories: resolvedCategories // Pass the full resolved categories for API calculation
        }));

        const apiResults = await gradingService.calculateBatchGrades(batchData);

        const gradesMap = {};
        apiResults.forEach(result => {
          const sId = String(result.studentId ?? result.StudentId ?? '');
          const fallback = localGrades[sId] || { initial: 0, quarterly: 0, descriptor: { label: '', color: '' }, categories: [] };

          // The backend calculation might not return the full breakdown for each category.
          // We keep the local calculation results (Total, PS, WS) if the API response is missing them.
          const apiCats = result.categories || result.Categories;
          const categories = (Array.isArray(apiCats) && apiCats.length > 0)
            ? apiCats.map(c => ({
                categoryId: c.categoryId ?? c.CategoryId ?? '',
                total: c.total ?? c.Total ?? 0,
                ps: c.ps ?? c.Ps ?? c.PS ?? 0,
                ws: c.ws ?? c.Ws ?? c.WS ?? 0
              }))
            : fallback.categories;

          gradesMap[sId] = {
            initial: result.initial ?? result.initialGrade ?? result.InitialGrade ?? fallback.initial,
            quarterly: result.quarterly ?? result.transmutedGrade ?? result.TransmutedGrade ?? fallback.quarterly,
            descriptor: {
              label: result.descriptor?.label ?? result.descriptorLabel ?? result.DescriptorLabel ?? fallback.descriptor?.label ?? '',
              color: result.descriptor?.color ?? result.descriptorColor ?? result.DescriptorColor ?? fallback.descriptor?.color ?? 'text-slate-400'
            },
            categories
          };
        });

        // Ensure every student has a grade entry even if the API returned nothing for them.
        students.forEach(student => {
          const sId = String(student.id);
          gradesMap[sId] = gradesMap[sId] || localGrades[sId];
        });

        setCalculatedGrades(gradesMap);
      } catch (error) {
        console.error('Failed to calculate grades:', error);
        setCalculatedGrades(localGrades);
      } finally {
        setCalculatingGrades(false);
      }
      };
      syncWithApi();
    } else {
      // Use local results for real-time updates while typing
      setCalculatedGrades(localGrades);
    }
  }, [students, subject, quarter, transmutationTable, descriptors, effectiveCategories, draftLoaded]);

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
                  onClick={handleSaveDraft}
                  disabled={draftStatus === 'saving' || !isEditable}
                  className={`flex items-center gap-2 px-4 py-2 border ${theme.styles.radiusSm} transition-all active:scale-95 shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed ${
                    hasUnsavedChanges 
                      ? 'bg-pink-600 border-pink-400 text-white animate-pulse shadow-lg shadow-pink-500/40' 
                      : draftStatus === 'error' 
                        ? 'bg-rose-500/20 border-rose-400 text-white' 
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  }`}
                >
                  {draftStatus === 'saving' ? <Loader2 size={18} className="animate-spin" /> : draftStatus === 'error' ? <ShieldAlert size={18} className="text-rose-300" /> : <Save size={18} />}
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">
                    {draftStatus === 'saving' ? "Saving..." : draftStatus === 'error' ? "Save Error" : hasUnsavedChanges ? "Save Changes" : "Save Draft"}
                  </span>
                </button>

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
          
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 p-6 bg-black/10 ${theme.styles.radiusSm}`}>
            <RecordMeta label="Teacher" value={subject.teacherName} />
            <RecordMeta label="Subject" value={subject.name} italic />
            <RecordMeta label="Template" value={template?.code || 'N/A'} />
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

       {isComposite && (
         <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto scrollbar-hide">
           <button
             onClick={() => setActiveComponentId('summary')}
             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
               activeComponentId === 'summary' 
                 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                 : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
             }`}
           >
             <Layers size={14} />
             Summary
           </button>

           {resolvedCategories.map(comp => (
             <button
               key={comp.id}
               onClick={() => setActiveComponentId(comp.id)}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 activeComponentId === comp.id 
                   ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                   : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
               }`}
             >
               {comp.name}
             </button>
           ))}
           <div className="flex-1"></div>
           <span className="text-[10px] font-black text-slate-400 uppercase self-center italic">Composite Subject Mode</span>
         </div>
       )}

        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full border-collapse border border-slate-200">
          <thead>
            {/* Category Header */}
            <tr className="bg-slate-100 text-xs font-black text-slate-600 uppercase divide-x divide-slate-300 border-b border-slate-300">
              <th rowSpan={2} className="p-4 text-left w-64 min-w-[250px] sticky left-0 bg-slate-100 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.05)] border-r border-slate-300">LEARNERS' NAMES</th>
              {!effectiveSummaryOnly && (effectiveCategories).map((cat, idx) => {
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
              {activeComponentId === 'summary' && resolvedCategories.map(comp => (
                <th key={`h-sum-${comp.id}`} className="p-4 text-center bg-indigo-100/50">
                  <div className="flex flex-col items-center">
                    <span className="font-black text-xs text-indigo-800 italic uppercase">{comp.name}</span>
                    <span className="text-[8px] opacity-50">Component Grade</span>
                  </div>
                </th>
              ))}
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
              {!effectiveSummaryOnly && (effectiveCategories).map((cat, idx) => {
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
              {!effectiveSummaryOnly && (effectiveCategories).map((cat, idx) => {
                const hpsValues = students[0]?.grades?.[subject.id]?.[quarter]?.categoryGrades?.[cat.id]?.hps || [];
                const count = cat.columnNames?.length || 5;

                return (
                  <React.Fragment key={`hps-${cat.id}`}>
                    {Array.from({length: count}).map((_, i) => (
                      <td key={`hps-${cat.id}-${i}`} className="p-0 text-center">
                        <input 
                          type="number"
                          value={(hpsValues[i] === undefined || hpsValues[i] === null || isNaN(Number(hpsValues[i]))) ? '' : Number(hpsValues[i])}
                          onChange={(e) => {
                            if (!isEditable) return;
                            let val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            if (isNaN(val) || val < 0) val = 0;
                            e.target.value = val.toString(); // Strip leading zeros (08 -> 8)
                            updateGrade('HPS', subject.id, cat.id, 'hps', i, val, quarter);
                          }}
                          disabled={!isEditable}
                          className={`w-full h-full py-2 px-1 text-center outline-none text-white font-black ${!isEditable ? 'bg-slate-800/50 cursor-not-allowed opacity-30 select-none' : 'bg-transparent focus:bg-slate-800 transition-colors'}`}
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
              {effectiveSummaryOnly && (effectiveCategories).map((cat, idx) => (
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
              const results = calculatedGrades[student.id] || { initial: 0, quarterly: 0, descriptor: { label: '', color: '' }, categories: [] };

              // For composite subjects, get the category results from the active component
              let componentCategoryResults = [];
              if (results.isComposite && results.components) {
                const activeCompResult = results.components.find(comp => comp.id === activeComponentId);
                componentCategoryResults = activeCompResult?.categories || [];
              }

              return (
                <tr key={student.id} className="group hover:bg-indigo-50/40 even:bg-slate-50/50 transition-colors divide-x divide-slate-200">
                  <td className="p-3 sticky left-0 bg-inherit z-10 shadow-[2px_0_4px_rgba(0,0,0,0.02)] border-r border-slate-200">
                    <div className="flex gap-2">
                       <span className="text-[9px] font-bold text-slate-400 w-4">{sIdx + 1}</span>
                       <span className="font-black text-slate-800 uppercase truncate">{student.name}</span>
                    </div>
                  </td>
                  
                  {!effectiveSummaryOnly && (effectiveCategories).map((cat, idx) => {
                    const cg = sg?.categoryGrades?.[cat.id];
                    const catRes = (isComposite ? componentCategoryResults : results.categories || []).find(c => c.categoryId === cat.id) || { total: 0, ps: 0, ws: 0 };
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
                                value={(cg?.scores[colIdx]?.points === null || cg?.scores[colIdx]?.points === undefined || isNaN(Number(cg?.scores[colIdx]?.points))) ? '' : Number(cg?.scores[colIdx]?.points)}
                                onChange={(e) => {
                                  if (isEditable) {
                                    let val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                    if (val !== null) {
                                      if (isNaN(val) || val < 0) val = 0;
                                      if (hps > 0 && val > hps) val = hps;
                                      e.target.value = val.toString(); // Strip leading zeros (08 -> 8)
                                    }
                                    updateGrade(student.id, subject.id, cat.id, 'points', colIdx, val, quarter);
                                  }
                                }}
                                className={`w-full h-full py-2 px-1 text-center outline-none font-bold ${hps === 0 || !isEditable ? 'bg-slate-200/40 text-slate-400 cursor-not-allowed select-none' : 'text-slate-900 bg-white/60 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-500 shadow-inner transition-all'}`}
                                disabled={hps === 0 || !isEditable}
                              />
                            </td>
                          );
                        })}
                        <td className={`p-2 text-center font-bold text-slate-500 select-none cursor-default ${idx % 2 === 0 ? 'bg-blue-50/30' : 'bg-emerald-50/30'}`}>{catRes.total}</td>
                        <td className={`p-2 text-center font-bold select-none cursor-default ${idx % 2 === 0 ? 'text-blue-400 bg-blue-50/40' : 'text-emerald-400 bg-emerald-50/40'}`}>{catRes.ps.toFixed(2)}</td>
                        <td className={`p-2 text-center font-black select-none cursor-default ${idx % 2 === 0 ? 'text-blue-500 bg-blue-100/30' : 'text-emerald-500 bg-emerald-100/30'}`}>{catRes.ws.toFixed(2)}</td>
                      </React.Fragment>
                    );
                  })}

                  {activeComponentId === 'summary' && results.isComposite && resolvedCategories.map(comp => {
                    const compRes = (results.components || []).find(c => c.id === comp.id);
                    return (
                      <td key={`cell-sum-${comp.id}`} className="p-3 text-center font-bold bg-indigo-50/30 text-indigo-600">
                        {calculatingGrades ? <Loader2 size={12} className="animate-spin mx-auto" /> : (compRes?.quarterly || 0)}
                      </td>
                    );
                  })}
                  
                  {/* Final results */}
                  <td className="p-2 text-center font-black bg-slate-200/50 text-slate-500 select-none cursor-default">{(results.initial || 0).toFixed(2)}</td>
                  <td className="p-2 text-center font-bold bg-slate-100/50 text-slate-400 border-l border-slate-200 select-none cursor-default">
                    {calculatingGrades ? (
                      <div className="flex items-center justify-center">
                        <Loader2 size={14} className="animate-spin text-slate-400" />
                      </div>
                    ) : (
                      results.quarterly || 0
                    )}
                  </td>
                  <td className={`p-2 text-center font-black bg-slate-50 border-l border-slate-200 text-[10px] uppercase italic ${results.descriptor?.color || ''}`}>
                    {results.descriptor?.label || ''}
                  </td>
                  <td className="p-3 bg-slate-900 text-white sticky right-0 z-20 shadow-[-4px_0_10px_rgba(0,0,0,0.2)]">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      {calculatingGrades ? (
                        <div className="flex items-center justify-center">
                          <Loader2 size={16} className="animate-spin text-white/70" />
                        </div>
                      ) : (
                        <>
                          <span className="text-base font-black leading-none">{results.quarterly || 0}</span>
                        </>
                      )}
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
           <div className={`flex items-center gap-5 p-5 ${hasUnsavedChanges ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-100'} border-2 rounded-[2rem] shadow-sm max-w-2xl transition-colors`}>
             <div className={`size-12 bg-white rounded-2xl flex items-center justify-center ${hasUnsavedChanges ? 'text-amber-600 border-amber-100' : 'text-rose-600 border-rose-100'} shadow-sm shrink-0 border`}>
               <ShieldAlert size={28} />
             </div>
             <div className="space-y-1">
               <p className={`text-[10px] font-black ${hasUnsavedChanges ? 'text-amber-600' : 'text-rose-600'} uppercase tracking-widest`}>
                 {hasUnsavedChanges ? 'Action Required: Save Progress' : 'Submission Notice'}
               </p>
               <p className={`text-sm font-black ${hasUnsavedChanges ? 'text-amber-900' : 'text-rose-900'} uppercase italic leading-tight`}>
                 {hasUnsavedChanges 
                   ? 'You have unsaved changes. Please click the pulsing "Save Changes" button at the top before submitting.'
                   : 'Once submitted, this record will be locked and cannot be edited without approval from the adviser.'}
               </p>
             </div>
           </div>
           <button
           onClick={() => {
               if (hasUnsavedChanges) {
                 alert('Cannot submit yet! You have unsaved changes in the class record. Please click "Save Changes" at the top of the table first to ensure your data is synced.');
                 return;
               }
               if (confirm('Are you sure you want to submit this class record? Once submitted, it cannot be edited unless the adviser approves an edit request.')) {
                 onSubmitClassRecord({
                   subject,
                   section,
                   teacher: currentUser,
                   students
                 });
               }
             }}
             disabled={draftStatus === 'saving'}
             className={`${theme.styles.button} ${hasUnsavedChanges ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-slate-200' : 'bg-emerald-500 hover:bg-emerald-600 text-white'} py-4 transition-all`}
           >
             <Send size={18} />
             Submit Record
           </button>
         </div>
       )}

       {isSubmitted && !isVerified && ( // Show this if locked but not yet verified
         <div className="p-4 md:p-8 bg-amber-50 border-t border-amber-200 flex items-center gap-3">
           <div className="text-2xl">🔒</div>
           <div>
             <p className="font-bold text-amber-900">Record Submitted & Locked</p>
             <p className="text-sm text-amber-800">
               Submitted on {new Date(savedRecord.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.
             </p>
           </div>
         </div>
       )}

       {isVerified && ( // NEW: Condition for "Record Verified & Finalized" message
         <div className="p-4 md:p-8 bg-emerald-50 border-t border-emerald-200 flex items-center gap-3">
           <div className="text-2xl">✅</div>
           <div>
             <p className="font-bold text-emerald-900">Record Verified & Finalized</p>
             <p className="text-sm text-emerald-800">
               {/* Assuming submittedAt is updated on verification too, or add a verifiedAt field */}
               Verified on {new Date(savedRecord.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.
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
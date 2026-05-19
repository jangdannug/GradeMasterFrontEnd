import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, User, Settings, Trash2, Plus, Save, 
  ChevronRight, ChevronLeft, Users, Move, Type, 
  Layout, Download, Upload, Search, Check, 
  X, GripVertical, MousePointer2, Layers, Maximize2, Minimize2, 
  ArrowLeft, PanelLeftClose, PanelLeftOpen, Loader2, Minus,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { calculateSubjectResult } from '../utils/calculations';
import { theme } from '../theme';

// Worker configuration for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

// Define options object outside the component to provide a constant reference identity.
// This prevents unnecessary reloads and silences the "Options prop passed to <Document /> changed" warning.
const PDF_OPTIONS = {
  workerSrc: pdfWorker,
};

const PARAMETER_DEFINITIONS = [
  {
    group: 'Basic Information',
    items: [
      { id: 'std_name', label: 'Student Name', iconType: 'User' },
      { id: 'std_lrn', label: 'LRN', iconType: 'Type' },
      { id: 'std_gender', label: 'Gender', iconType: 'Type' },
      { id: 'std_grade', label: 'Grade Level', iconType: 'Layers' },
      { id: 'std_section', label: 'Section', iconType: 'Layout' },
    ]
  },
  {
    group: 'School Details',
    items: [
      { id: 'sch_name', label: 'School Name', iconType: 'Type' },
      { id: 'sch_year', label: 'School Year', iconType: 'Type' },
      { id: 'sch_region', label: 'Region', iconType: 'Type' },
      { id: 'sch_division', label: 'Division', iconType: 'Type' },
    ]
  },
  {
    group: 'Personnel',
    items: [
      { id: 'fac_adviser', label: 'Adviser Name', iconType: 'User' },
      { id: 'fac_principal', label: 'Principal', iconType: 'User' },
    ]
  }
];

export function DocTagMapper({ 
  systemStudents = [], 
  systemSections = [], 
  systemBaseSubjects = [], 
  systemSubjects = [],
  savedClassRecords = [],
  transmutationTable = [],
  descriptors = [],
  currentUser 
}) {
  // Core State
  const navigate = useNavigate();
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [placedFields, setPlacedFields] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [templateName, setTemplateName] = useState('New Template');

  // UI State
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [scale, setScale] = useState(1.1);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isTemplatesDropdownOpen, setIsTemplatesDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMovingWithArrows, setIsMovingWithArrows] = useState(false);
  const [paramSearch, setParamSearch] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const containerRef = useRef(null);
  const pageRef = useRef(null);
  const menuRef = useRef(null);
  const [moveVersion, setMoveVersion] = useState(0);

  const allParameterDefinitions = useMemo(() => {
    const groups = [...PARAMETER_DEFINITIONS];
    
    const subjectsByGrade = systemBaseSubjects.reduce((acc, sub) => {
      if (!acc[sub.gradeLevel]) acc[sub.gradeLevel] = [];
      acc[sub.gradeLevel].push(sub);
      return acc;
    }, {});
    
    Object.keys(subjectsByGrade).sort((a, b) => parseInt(a) - parseInt(b)).forEach(grade => {
      const items = subjectsByGrade[grade].flatMap(sub => {
        const base = [
          { id: `sub_${sub.id}_q1`, label: `${sub.name} Q1`, iconType: 'Type' },
          { id: `sub_${sub.id}_q2`, label: `${sub.name} Q2`, iconType: 'Type' },
          { id: `sub_${sub.id}_q3`, label: `${sub.name} Q3`, iconType: 'Type' },
          { id: `sub_${sub.id}_q4`, label: `${sub.name} Q4`, iconType: 'Type' },
          { id: `sub_${sub.id}_final`, label: `${sub.name} Final`, iconType: 'Type' },
        ];
        // Add component tags if subject is composite
        const components = sub.categories?.filter(c => c.isComponent) || [];
        const compItems = components.flatMap(comp => [
          { id: `sub_${sub.id}_comp_${comp.id}_q1`, label: `${sub.name}-${comp.name} Q1`, iconType: 'Type' },
          { id: `sub_${sub.id}_comp_${comp.id}_final`, label: `${sub.name}-${comp.name} Final`, iconType: 'Type' },
        ]);
        return [...base, ...compItems];
      });
      groups.push({ group: `Grades - Grade ${grade}`, items });
    });
    return groups;
  }, [systemBaseSubjects]);

  // Track mounted fields to skip entrance animations during remounts (e.g. arrow key moves)
  const mountedFieldsRef = useRef(new Set());
  useEffect(() => {
    // Add existing fields to the set of "already mounted" fields after render
    placedFields.forEach(f => mountedFieldsRef.current.add(f.instanceId));
  }, [placedFields]);

  const updateFieldFontSize = (instanceId, delta) => {
    setPlacedFields(prev => prev.map(f => {
      if (f.instanceId === instanceId) {
        return { ...f, fontSize: Math.max(6, Math.min(72, f.fontSize + delta)) };
      }
      return f;
    }));
  };

  // Handle outside interactions for the pop-over menu
  useEffect(() => {
    const handleOutsideInteraction = (e) => {
      if (menuAnchor && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAnchor(null);
      }
    };
    if (menuAnchor) {
      document.addEventListener('mousedown', handleOutsideInteraction);
      document.addEventListener('touchstart', handleOutsideInteraction);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, [menuAnchor]);

  // Handle Arrow Keys for precision movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedFieldId || isStudentModalOpen || isTemplatesDropdownOpen) return;

      const step = e.shiftKey ? 1 : 0.1;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        setIsMovingWithArrows(true);
        e.preventDefault();
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        updateFieldPosition(selectedFieldId, dx, dy);
      }

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        updateFieldFontSize(selectedFieldId, 1);
      }

      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        updateFieldFontSize(selectedFieldId, -1);
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        removeField(selectedFieldId);
        setSelectedFieldId(null);
      }

      if (e.key === 'Escape') {
        setSelectedFieldId(null);
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        setIsMovingWithArrows(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedFieldId, isStudentModalOpen, isTemplatesDropdownOpen]);

  // Reset page count when the file changes
  useEffect(() => {
    setNumPages(null);
    setIsPdfReady(false);
  }, [pdfFile]);

  // Handle Browser Fullscreen API
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

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const loadTemplate = useCallback((template) => {
    setActiveTemplateId(template.id);
    localStorage.setItem('docTag_activeTemplateId', template.id);
    setPlacedFields(template.fields || []);
    setTemplateName(template.name);

    if (template.pdfData) {
      setPdfFile(prev => {
        if (prev !== template.pdfData) {
          setIsPdfReady(false);
        }
        return template.pdfData;
      });
    }

    setSelectedFieldId(null);
    setMenuAnchor(null);

    if (template.fields && template.fields.length > 0 && template.fields[0].page !== undefined) {
      setCurrentPage(template.fields[0].page);
    }
  }, []);

  const syncSystemData = useCallback(() => {
    const savedTemplates = JSON.parse(localStorage.getItem('docTag_templates') || '[]');

    const mappedSystemStudents = systemStudents.map(s => {
      const section = systemSections.find(sec => String(sec.id) === String(s.sectionId));
      const gradeValues = {};

      // Dynamically calculate accurate grades for each subject template
      systemBaseSubjects.forEach(baseSub => {
        const instance = systemSubjects.find(sub => 
          String(sub.baseSubjectId) === String(baseSub.id) && 
          String(sub.sectionId) === String(s.sectionId)
        );
        
        if (instance) {
          const resolvedCategories = (instance.categories && instance.categories.length > 0) 
            ? instance.categories 
            : (baseSub?.categories || []);
          const instanceWithCats = { ...instance, categories: resolvedCategories };
          const isComposite = resolvedCategories.some(c => c.isComponent);
          const quarterlyScores = [];
          const componentScoresMap = {};

          for (let q = 1; q <= 4; q++) {
            try {
              // Accuracy Fix: Prioritize Verified Class Records over live data
              const recordId = `${s.sectionId}-${instance.id}-Q${q}`;
              const verifiedRecord = savedClassRecords.find(r => r.id === recordId && r.isVerified);
              let sg = verifiedRecord 
                ? verifiedRecord.studentSnapshots?.find(sn => String(sn.id) === String(s.id))?.grades 
                : s.grades?.[instance.id]?.[q];

              const result = calculateSubjectResult(sg, instanceWithCats, transmutationTable, descriptors);
              const qGrade = result?.quarterly || 0;
              gradeValues[`sub_${baseSub.id}_q${q}`] = qGrade > 0 ? String(qGrade) : '';
              if (qGrade > 0) quarterlyScores.push(qGrade);

              if (isComposite && result?.components) {
                result.components.forEach(cr => {
                  const val = cr.quarterly || 0;
                  gradeValues[`sub_${baseSub.id}_comp_${cr.id}_q${q}`] = val > 0 ? String(val) : '';
                  if (val > 0) {
                    if (!componentScoresMap[cr.id]) componentScoresMap[cr.id] = [];
                    componentScoresMap[cr.id].push(val);
                  }
                });
              }
            } catch (e) {}
          }
          
          if (quarterlyScores.length > 0) {
            gradeValues[`sub_${baseSub.id}_final`] = String(Math.round(quarterlyScores.reduce((a,b)=>a+b,0)/quarterlyScores.length));
          }
          if (isComposite) {
            Object.entries(componentScoresMap).forEach(([cid, scores]) => {
              gradeValues[`sub_${baseSub.id}_comp_${cid}_final`] = String(Math.round(scores.reduce((a,b)=>a+b,0)/scores.length));
            });
          }
        }
      });

      return {
        id: s.id,
        name: s.name,
        isSystemRecord: true,
        values: {
          'std_name': s.name,
          'std_lrn': s.lrn,
          'std_gender': s.gender,
          'std_grade': s.gradeLevel,
          'std_section': section?.name || 'N/A',
          'sch_name': section?.schoolName || '',
          'sch_year': s.schoolYear || section?.schoolYear || '',
          'sch_region': section?.region || '',
          'sch_division': section?.division || '',
          'fac_adviser': section?.adviserName || '',
          ...gradeValues
        }
      };
    });

    const customStudents = JSON.parse(localStorage.getItem('docTag_students') || '[]');
    const allStudents = [...mappedSystemStudents, ...customStudents];

    setStudents(allStudents);
    setTemplates(savedTemplates);

    const lastActiveId = localStorage.getItem('docTag_activeTemplateId');
    if (lastActiveId && !activeTemplateId) {
      const template = savedTemplates.find(t => t.id === lastActiveId);
      if (template) {
        loadTemplate(template);
      }
    }

    if (allStudents.length > 0 && !selectedStudentId) setSelectedStudentId(allStudents[0].id);
  }, [activeTemplateId, loadTemplate, selectedStudentId, systemSections, systemStudents, systemSubjects, systemBaseSubjects, savedClassRecords, transmutationTable, descriptors]);

  useEffect(() => {
    syncSystemData();
  }, [syncSystemData]);

  const currentStudent = useMemo(() =>
    students.find(s => s.id === selectedStudentId) || null
  , [students, selectedStudentId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPdfFile(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const placeParameter = (param, x, y) => {
    const newField = {
      ...param,
      instanceId: uuidv4(),
      x,
      y,
      page: currentPage,
      fontSize: 12
    };
    setPlacedFields(prev => [...prev, newField]);
  };

  const handlePageClick = (e) => {
    if (e.target.closest('.placed-tag-item') || e.target.closest('button')) return;

    setSelectedFieldId(null);

    if (!pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMenuAnchor({
      x,
      y,
      clientX: e.clientX,
      clientY: e.clientY
    });
  };

 const updateFieldPosition = (instanceId, deltaX, deltaY) => {
  setPlacedFields(prev => prev.map(f => {
    if (f.instanceId === instanceId) {
      const newX = Math.max(0, Math.min(100, f.x + deltaX));
      const newY = Math.max(0, Math.min(100, f.y + deltaY));
      return { ...f, x: newX, y: newY };
    }
    return f;
  }));
  setMoveVersion(v => v + 1); // force remount to clear Framer's drag transform
};

  // KEY FIX: Use element's top-left corner relative to container as percentage.
  // This is zoom-independent because both numerator and denominator scale together.
  const handleDragEnd = (instanceId, e, info) => {
    const container = pageRef.current;
    const element = e.target.closest('.placed-tag-item');
    if (!container || !element) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const x = ((elementRect.left - containerRect.left) / containerRect.width) * 100;
    const y = ((elementRect.top - containerRect.top) / containerRect.height) * 100;

    setPlacedFields(prev => prev.map(f =>
      f.instanceId === instanceId
        ? { ...f, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
        : f
    ));
    
    setMoveVersion(v => v + 1); // SYNC: Match arrow key behavior to clear internal drag transforms
  };

  const removeField = (instanceId) => {
    setPlacedFields(placedFields.filter(f => f.instanceId !== instanceId));
  };

  const saveTemplate = () => {
    let updated;
    if (activeTemplateId) {
      updated = templates.map(t =>
        t.id === activeTemplateId
          ? { ...t, name: templateName, fields: placedFields, pdfData: pdfFile }
          : t
      );
    } else {
      const newId = uuidv4();
      const newTemplate = {
        id: newId,
        name: templateName,
        pdfData: pdfFile,
        fields: placedFields,
        pdfName: 'Last Document'
      };
      updated = [...templates, newTemplate];
      setActiveTemplateId(newId);
      localStorage.setItem('docTag_activeTemplateId', newId);
    }

    setTemplates(updated);
    localStorage.setItem('docTag_templates', JSON.stringify(updated));
    alert('Template saved successfully!');
  };

  const deleteTemplate = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updated = templates.filter(t => t.id !== id);
      setTemplates(updated);
      localStorage.setItem('docTag_templates', JSON.stringify(updated));
      if (activeTemplateId === id) {
        createNewTemplate();
      }
    }
  };

  const createNewTemplate = () => {
    setActiveTemplateId(null);
    localStorage.removeItem('docTag_activeTemplateId');
    setPlacedFields([]);
    setPdfFile(null);
    setSelectedFieldId(null);
    setTemplateName('New Template');
    setIsPdfReady(false);
    setIsTemplatesDropdownOpen(false);
  };

  const getFieldValue = (paramId) => {
    if (!currentStudent) return `{${paramId}}`;
    return currentStudent.values[paramId] || '';
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] flex flex-col bg-slate-100 font-sans text-slate-900 overflow-hidden"
    >
      {/* Unified Toolbar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Exit Mapper"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="h-8 w-px bg-slate-200 mx-2" />

          {/* Templates Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTemplatesDropdownOpen(!isTemplatesDropdownOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${isTemplatesDropdownOpen ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <Layout size={16} /> Layouts <ChevronRight size={14} className={`transition-transform ${isTemplatesDropdownOpen ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {isTemplatesDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTemplatesDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-2 left-0 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3 mb-1">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Saved Layouts</span>
                      <button onClick={createNewTemplate} className="size-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-1 scrollbar-hide">
                      {templates.map(t => (
                        <div key={t.id} onClick={() => { loadTemplate(t); setIsTemplatesDropdownOpen(false); }} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all ${activeTemplateId === t.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                          <span className={`text-[11px] font-bold uppercase truncate ${activeTemplateId === t.id ? 'text-indigo-700' : 'text-slate-600'}`}>{t.name}</span>
                          <button onClick={(e) => deleteTemplate(t.id, e)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                        </div>
                      ))}
                      {templates.length === 0 && <p className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase italic">No layouts found</p>}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Student Manager Trigger */}
          <button
            onClick={() => setIsStudentModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-100 transition-all"
          >
            <Users size={16} /> Students
          </button>

          <div className="h-8 w-px bg-slate-200 mx-2" />

          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="bg-slate-100 border-none rounded-lg px-3 py-1.5 text-xs font-black uppercase italic text-slate-700 focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={saveTemplate} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Save Template">
            <Save size={18} />
          </button>

          {selectedFieldId && (
            <div className="flex items-center gap-1 bg-indigo-50 rounded-xl p-1 border border-indigo-100 ml-2">
              <span className="text-[9px] font-black px-2 text-indigo-600 uppercase">Size</span>
              <button
                onClick={() => updateFieldFontSize(selectedFieldId, -1)}
                className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600"
              >
                <Minus size={14} />
              </button>
              <span className="text-[10px] font-black w-6 text-center text-indigo-700">
                {placedFields.find(f => f.instanceId === selectedFieldId)?.fontSize}
              </span>
              <button
                onClick={() => updateFieldFontSize(selectedFieldId, 1)}
                className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200 mr-4">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-[10px] font-black w-10 text-center text-slate-500">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(s => Math.min(2.5, s + 0.1))}
              className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Page {currentPage} of {numPages || '?'}
          </span>
          <button
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl transition-all ${isFullscreen ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'}`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all cursor-pointer shadow-lg shadow-indigo-100">
            <Upload size={14} /> Upload PDF
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      </header>

      {/* Canvas Area */}
      <main className="flex-1 overflow-auto p-2 md:p-4 bg-slate-200/50 flex justify-center scrollbar-hide">
        {pdfFile ? (
          <div className="relative shadow-2xl bg-white w-fit h-fit" ref={pageRef} onClick={handlePageClick}>
            <Document
              key={activeTemplateId || 'new-document'}
              file={pdfFile}
              options={PDF_OPTIONS}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={(error) => console.error("PDF Load Error:", error)}
              className="select-none"
              loading={
                <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-3">
                  <Loader2 className="animate-spin text-indigo-600" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest italic">Loading Document...</p>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center p-20 text-rose-500 gap-3">
                  <X size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest italic">Failed to load PDF. Please try a different file.</p>
                </div>
              }
            >
              {numPages && (
                <Page
                  pageNumber={currentPage}
                  onRenderSuccess={() => setIsPdfReady(true)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={1100 * scale}
                />
              )}
            </Document>

            {/* Placed Tags Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <AnimatePresence>
                {isPdfReady && (
                  <motion.div
                    key={`${activeTemplateId || 'new'}-${currentPage}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0"
                  >
                    {placedFields.filter(f => Number(f.page) === Number(currentPage)).map(field => (
                      <motion.div
                        // KEY FIX: include x/y in key so Framer resets its internal
                        // drag transform whenever the stored position changes.
key={`${field.instanceId}-${Math.round(field.x * 100)}-${Math.round(field.y * 100)}-${moveVersion}`}                        drag
                        dragMomentum={false}
                        dragElastic={0}
                        dragConstraints={pageRef}
                        onDragStart={() => setSelectedFieldId(field.instanceId)}
                        onDragEnd={(e, info) => handleDragEnd(field.instanceId, e, info)}
                        onTapStart={() => {
                          setSelectedFieldId(field.instanceId);
                          setMenuAnchor(null);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        initial={mountedFieldsRef.current.has(field.instanceId) ? false : { scale: 0.8, opacity: 0 }}
                        animate={{
                          scale: 1,
                          opacity: (selectedFieldId === field.instanceId && isMovingWithArrows) ? 0.5 : 1,
                        }}
                        whileDrag={{ opacity: 0.5, scale: 1.05, cursor: 'grabbing' }}
                        style={{
                          position: 'absolute',
                          left: `${field.x}%`,
                          top: `${field.y}%`,
                          // FIX: do NOT multiply fontSize or dimensions by scale.
                          // Positions are stored as % of container. If the tag's
                          // rendered size changes with scale, the saved top-left
                          // percentage drifts. Keep tag size fixed in pixels.
                          fontSize: `${field.fontSize}px`,
                          minWidth: '40px',
                          minHeight: '28px',
                          transform: 'none',
                          zIndex: selectedFieldId === field.instanceId ? 50 : 10,
                        }}
                        className={`placed-tag-item pointer-events-auto group flex items-center justify-center whitespace-nowrap px-2 py-1 rounded-md font-bold shadow-sm cursor-move transition-all ${
                          selectedFieldId === field.instanceId
                            ? 'bg-indigo-600 text-white border-2 border-white ring-2 ring-indigo-600'
                            : 'bg-indigo-600/10 border border-indigo-600/50 text-indigo-700 hover:bg-indigo-600/20'
                        }`}
                      >
                        <span className="pointer-events-none uppercase">{getFieldValue(field.id)}</span>
                        <button
                          onClick={() => removeField(field.instanceId)}
                          className="ml-2 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pop-over Selector Menu */}
            <AnimatePresence>
              {menuAnchor && (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  style={{ left: menuAnchor.clientX, top: menuAnchor.clientY }}
                  className="fixed z-50 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                >
                  <div className="p-3 bg-slate-50 border-b border-slate-100 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assign Data Tag</p>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search parameters..."
                        value={paramSearch}
                        onChange={(e) => setParamSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1 scrollbar-hide">
                    {allParameterDefinitions.flatMap(g => g.items)
                      .filter(p => p.label.toLowerCase().includes(paramSearch.toLowerCase()))
                      .map(param => (
                        <button
                          key={param.id}
                          onClick={() => {
                            placeParameter(param, menuAnchor.x, menuAnchor.y);
                            setMenuAnchor(null);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg flex items-center gap-3 group transition-colors"
                        >
                          <div className="size-6 bg-slate-100 rounded flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <Plus size={14} />
                          </div>
                          <span className="text-xs font-bold text-slate-600 uppercase group-hover:text-indigo-700">{param.label}</span>
                        </button>
                      ))}
                    {allParameterDefinitions.flatMap(g => g.items).filter(p => p.label.toLowerCase().includes(paramSearch.toLowerCase())).length === 0 && (
                      <p className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase italic">No matches</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="size-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center border border-slate-100">
              <Upload size={48} className="text-slate-200" />
            </div>
            <p className="font-black uppercase tracking-widest italic text-xs">Upload a PDF document to begin mapping tags</p>
          </div>
        )}
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Current Student: <span className="text-indigo-600">{currentStudent?.name || 'NONE SELECTED'}</span>
        </p>
        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase">
          <span>Placed Tags: {placedFields.length}</span>
        </div>
      </footer>

      {/* Student Management Modal */}
      <AnimatePresence>
        {isStudentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsStudentModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Student Manager</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Manage sample records and field values.</p>
                </div>
                <button onClick={() => setIsStudentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
              </div>

              <div className="p-8 grid grid-cols-2 gap-8 h-[500px]">
                {/* Student List */}
                <div className="space-y-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Available Records</span>
                    <button
                      onClick={() => {
                        const newStd = { id: uuidv4(), name: 'New Student', values: {} };
                        const updated = [...students, newStd];
                        setStudents(updated);
                        setSelectedStudentId(newStd.id);
                        localStorage.setItem('docTag_students', JSON.stringify(updated.filter(s => !s.isSystemRecord)));
                      }}
                      className="text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                    {students.map(s => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between group cursor-pointer transition-all ${selectedStudentId === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200'}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase truncate max-w-[150px]">{s.name}</span>
                          {s.isSystemRecord && <span className={`text-[8px] font-black uppercase ${selectedStudentId === s.id ? 'text-white/60' : 'text-indigo-400'}`}>System Data</span>}
                        </div>

                        {!s.isSystemRecord && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = students.filter(st => st.id !== s.id);
                              setStudents(updated);
                              localStorage.setItem('docTag_students', JSON.stringify(updated.filter(st => !st.isSystemRecord)));
                            }}
                            className={`p-1 rounded-md transition-colors ${selectedStudentId === s.id ? 'hover:bg-white/20 text-white/60' : 'hover:bg-rose-50 text-slate-300 hover:text-rose-500'}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Value Editor */}
                <div className="bg-slate-50 rounded-2xl p-6 flex flex-col">
                  {currentStudent ? (
                    <div className="space-y-6 flex-1 flex flex-col">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Display Name</label>
                        <input
                          type="text"
                          value={currentStudent.name}
                          onChange={(e) => {
                            const updated = students.map(s => s.id === currentStudent.id ? { ...s, name: e.target.value } : s);
                            setStudents(updated);
                            localStorage.setItem('docTag_students', JSON.stringify(updated.filter(st => !st.isSystemRecord)));
                          }}
                          disabled={currentStudent.isSystemRecord}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                        <p className="text-[10px] font-black uppercase text-slate-400 px-1 border-b border-slate-200 pb-1">Field Values</p>
                        {allParameterDefinitions.flatMap(g => g.items).map(param => (
                          <div key={param.id} className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase px-1">{param.label}</label>
                            <input
                              type="text"
                              value={currentStudent.values[param.id] || ''}
                              onChange={(e) => {
                                const updated = students.map(s => {
                                  if (s.id === currentStudent.id) {
                                    return { ...s, values: { ...s.values, [param.id]: e.target.value } };
                                  }
                                  return s;
                                });
                                setStudents(updated);
                                localStorage.setItem('docTag_students', JSON.stringify(updated.filter(st => !st.isSystemRecord)));
                              }}
                              disabled={currentStudent.isSystemRecord}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold"
                              placeholder={`Value for ${param.label}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                      <MousePointer2 size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Select a student</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .react-pdf__Page__canvas {
          margin: 0 auto;
          border-radius: 4px;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
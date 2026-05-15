import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Plus, Trash2, Settings, Loader2, RefreshCw, Save, Layers, X, Info, User } from 'lucide-react';
import { ApiConnectionErrorDisplay } from '../components/ApiConnectionErrorDisplay';
import { theme } from '../theme';

export function TemplatesView({
  subjects,
  syncSubjects,
  isLoading,
  syncError,
  addCategory,
  removeCategory,
  resetSubjectTemplate,
  updateCategoryTitle,
  updateCategoryWeight,
  addColumnToCategory,
  removeColumnFromCategory,
  updateColumnName,
  onUpdateBaseSubject,
  addComponentToSubject, // NEW
  removeComponentFromSubject, // NEW
  updateComponentName, // NEW
  convertToComposite, // NEW
  convertToNonComposite, // NEW
  updateComponentTeacher, // NEW
  users = [] // NEW
}) {
  const location = useLocation();
  const [selectedBaseSubjectId, setSelectedBaseSubjectId] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [activeComponentId, setActiveComponentId] = useState(null); // Keep track of active component
  const [editingColumnIndex, setEditingColumnIndex] = useState(null); 
  const [editedColumnName, setEditedColumnName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingComponentName, setEditingComponentName] = useState(null); // NEW: For renaming components
  const [newComponentName, setNewComponentName] = useState(''); // NEW: For renaming components

  // Set initial selected subject or update when subjects change
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      // Only initialize from location state if we haven't selected a subject yet
      if (!selectedBaseSubjectId) {
        const stateId = location.state?.subjectId;
        if (stateId && subjects.some(s => String(s.id) === String(stateId))) {
          setSelectedBaseSubjectId(stateId);
        } else {
          setSelectedBaseSubjectId(subjects[0].id);
        }
      } else {
        // If already selected, only reset if the current selection no longer exists in the list
        const stillExists = subjects.some(s => String(s.id) === String(selectedBaseSubjectId));
        if (!stillExists) {
          setSelectedBaseSubjectId(subjects[0].id);
        }
      }
    }
  }, [subjects, location.state?.subjectId]);

  const selectedSubject = subjects.find(s => String(s.id) === String(selectedBaseSubjectId));
  
  // Determine if the subject is composite
  const isComposite = selectedSubject?.categories?.some(c => c.isComponent) || false;
  const components = isComposite ? selectedSubject.categories : [];
  
  // Ensure activeComponentId is synced when the selected subject changes
  useEffect(() => {
    if (isComposite && components.length > 0) {
      setActiveComponentId(components[0].id);
    } else {
      setActiveComponentId(null); // Clear if not composite
    }
  }, [selectedBaseSubjectId, isComposite]);

  const activeComponent = components.find(c => c.id === activeComponentId);
  const currentCategories = isComposite ? (activeComponent?.categories || []) : (selectedSubject?.categories || []);

  const totalWeight = currentCategories.reduce((acc, cat) => acc + (cat.weight || 0), 0);
  const isWeightValid = Math.round(totalWeight * 100) === 100;

  // NEW: Handle converting to composite
  const handleConvertToComposite = async () => {
    if (!selectedSubject) return;
    if (!window.confirm("Convert this to a composite subject (like MAPEH)? Existing categories will be moved into the first component. This action will reset the template structure.")) return;

    try {
      convertToComposite(selectedSubject.id); 
      alert('Subject converted to composite successfully! Please configure components.');
    } catch (err) {
      alert(`Conversion failed: ${err}`);
    }
  };

  // NEW: Handle converting to non-composite
  const handleConvertToNonComposite = async () => {
    if (!selectedSubject) return;
    if (!window.confirm("Convert this back to a non-composite subject? Only categories from the first component will be kept. This action will reset the template structure.")) return;

    try {
      convertToNonComposite(selectedSubject.id);
      alert('Subject converted to non-composite successfully!');
    } catch (err) {
      alert(`Conversion failed: ${err}`);
    }
  };

  // NEW: Handle adding a new component
  const handleAddComponent = async () => {
    if (!selectedSubject || !isComposite) return;
    const componentName = prompt("Enter name for new component (e.g., HEALTH):");
    if (!componentName) return;

    try {
      addComponentToSubject(selectedSubject.id, componentName);
      alert('Component added successfully!');
    } catch (err) {
      alert(`Failed to add component: ${err}`);
    }
  };

  const handleSave = async () => {
    if (!selectedSubject) return;
    if (!isWeightValid) {
      alert(`Cannot save template: The total weight of all categories is ${Math.round(totalWeight * 100)}%. It must be exactly 100% before saving.`);
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateBaseSubject(selectedSubject.id, {
        Name: selectedSubject.name,
        Code: selectedSubject.code,
        GradeLevel: selectedSubject.gradeLevel,
        SchoolId: selectedSubject.schoolId, // Pass the existing school ID back to the server
        CategoriesJson: JSON.stringify(selectedSubject.categories), // Backend expects stringified JSON
        PushToInstances: true // Push structure changes to active classes
      });
      alert('Template saved to database successfully!');
    } catch (err) {
      alert(`Failed to save: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle early returns for error or loading
  if (syncError) return <ApiConnectionErrorDisplay />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <Loader2 className="animate-spin mr-2" size={24} />
        <span className="font-bold uppercase tracking-widest text-sm">Loading Subject Templates...</span>
      </div>
    );
  }

  if (!selectedSubject && subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
        <BookOpen size={48} className="opacity-20" />
        <p className="font-bold">No subject templates available. Add one from the Admin Panel.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 ${theme.styles.card}`}>
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Subject Grading Templates</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Configure grading categories and weights for each subject template.</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="select-template" className="text-xs font-black uppercase text-slate-500">Select Template:</label>
          <select
            id="select-template"
            value={selectedBaseSubjectId}
            onChange={(e) => setSelectedBaseSubjectId(e.target.value)}
            className={`${theme.styles.input} !bg-white/50 !border-white/60 !rounded-xl px-4 py-2 font-bold text-slate-700 text-sm`}
          >
            {[...subjects].sort((a, b) => a.name.localeCompare(b.name)).map((sub, idx) => (
              <option key={sub.id || idx} value={sub.id}>{sub.name} (G{sub.gradeLevel})</option>
            ))}
          </select>
        </div>
      </div>
      
      {selectedSubject && ( // Main content area
        <div className={`${theme.styles.card} p-6 space-y-6`}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black uppercase italic text-slate-800 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" /> 
              {selectedSubject.name} (G{selectedSubject.gradeLevel})
              {(!selectedSubject.categories || selectedSubject.categories.length === 0) ? (
                <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100 not-italic tracking-normal">Unconfigured</span>
              ) : (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 not-italic uppercase tracking-tighter font-black">Configured</span>
              )}
            </h3>
            <div className="flex gap-2">
              <div className="hidden md:flex flex-col items-end justify-center mr-4 pr-4 border-r border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Weight</span>
                <span className={`text-sm font-black ${isWeightValid ? 'text-emerald-600' : 'text-rose-500 animate-pulse'}`}>
                  {Math.round(totalWeight * 100)}%
                </span>
              </div>
              <button
                onClick={() => resetSubjectTemplate(selectedSubject.id)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all"
                title="Reset to default categories"
              >
                <RefreshCw size={14} /> Reset Template
              </button>
              <button
                onClick={() => addCategory(selectedSubject.id, activeComponentId)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Plus size={14} /> Add Category
              </button>
              {!isComposite && (
                <button
                  onClick={handleConvertToComposite}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase hover:bg-black transition-all shadow-lg"
                >
                  <Layers size={14} /> Make Composite
                </button>
              )}
              {isComposite && (
                <button
                  onClick={handleConvertToNonComposite}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-600 transition-all shadow-lg"
                >
                  <Layers size={14} /> Make Non-Composite
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || !isWeightValid}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg disabled:opacity-50 ${isWeightValid ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-slate-400 cursor-not-allowed'}`}
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {isComposite && (
            <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-xl shadow-inner">
              {components.map(comp => (
                <div key={comp.id} className="relative group">
                  {editingComponentName === comp.id ? (
                    <input
                      type="text"
                      value={newComponentName}
                      onChange={e => setNewComponentName(e.target.value)}
                      onBlur={() => {
                        updateComponentName(selectedSubject.id, comp.id, newComponentName);
                        setEditingComponentName(null);
                      }}
                      onKeyDown={e => e.key === 'Enter' && updateComponentName(selectedSubject.id, comp.id, newComponentName)}
                      autoFocus
                      placeholder="Component Name"
                      className="px-4 py-2 rounded-lg text-xs font-black uppercase bg-white text-indigo-600 shadow-sm border border-indigo-200 outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => setActiveComponentId(comp.id)}
                      onDoubleClick={() => {
                        setEditingComponentName(comp.id);
                        setNewComponentName(comp.name);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                        activeComponentId === comp.id
                          ? 'bg-white text-indigo-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {comp.name || <span className="italic opacity-50">Untitled Component</span>}
                    </button>
                  )}
                </div>
              ))}
              <button // Add Component Button
                onClick={handleAddComponent}
                className="px-4 py-2 rounded-lg text-xs font-black uppercase text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-1"
              >
                <Plus size={14} /> Add Component
              </button>
            </div>
          )}

          {isComposite && activeComponent && (
            <div className="flex items-center gap-4 p-4 bg-indigo-100/50 rounded-xl border border-indigo-200/50">
              <div className="size-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
                <User size={16} />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-black uppercase text-indigo-500 block mb-1">Assigned Component Teacher</label>
                <select
                  value={activeComponent.teacherId || ''}
                  onChange={(e) => updateComponentTeacher(selectedSubject.id, activeComponent.id, e.target.value || null)}
                  className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="" className="text-slate-400">Default (Main Subject Teacher)</option>
                  {users.filter(u => u.role === 'teacher' || u.role === 'adviser').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {currentCategories.map((category, idx) => (
              <div key={category.id || idx} className="bg-white/50 p-4 rounded-xl border border-white/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {editingCategoryId === category.id && editingColumnIndex === null ? (
                      <input
                        type="text"
                        value={category.name}
                        placeholder="Category Title"
                        onChange={(e) => updateCategoryTitle(selectedSubject.id, category.id, e.target.value, activeComponentId)}
                        onBlur={() => setEditingCategoryId(null)} // Save on blur
                        onKeyDown={(e) => e.key === 'Enter' && setEditingCategoryId(null)}
                        autoFocus
                        className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-sm font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    ) : (
                      <h4 
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setEditingColumnIndex(null);
                        }}
                        className="font-black text-slate-800 uppercase text-sm cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        {category.name || <span className="text-slate-400 italic">Untitled Category</span>}
                      </h4>
                    )}
                    <span className="text-xs text-slate-600 font-medium">({(category.weight * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {category.columnNames?.map((colName, colIdx) => (
                      <span key={colIdx} className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        {editingCategoryId === category.id && editingColumnIndex === colIdx ? (
                          <input
                            type="text"
                            value={editedColumnName}
                            onChange={(e) => setEditedColumnName(e.target.value)}
                            onBlur={() => {
                              updateColumnName(selectedSubject.id, category.id, colIdx, editedColumnName, activeComponentId); // Pass activeComponentId
                              setEditingColumnIndex(null);
                              setEditedColumnName('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateColumnName(selectedSubject.id, category.id, colIdx, editedColumnName, activeComponentId);
                                setEditingColumnIndex(null);
                                setEditedColumnName('');
                              }
                            }}
                            className="w-16 bg-white/50 border border-indigo-200 rounded-lg px-1 text-[10px] font-bold outline-none"
                            autoFocus
                          />
                        ) : (
                          <span 
                            onClick={() => {
                              setEditingCategoryId(category.id);
                              setEditingColumnIndex(colIdx);
                              setEditedColumnName(colName);
                            }}
                            className="cursor-pointer hover:text-indigo-600"
                          >
                            {colName || <span className="opacity-50">?</span>}
                          </span>
                        )}
                      </span>
                    ))}
                    <button onClick={() => addColumnToCategory(selectedSubject.id, category.id, activeComponentId)} className="text-slate-400 hover:text-indigo-600"><Plus size={14} /></button>
                    {category.columnNames?.length > 1 && (
                      <button onClick={() => removeColumnFromCategory(selectedSubject.id, category.id, activeComponentId)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(category.weight * 100)}
                    onChange={(e) => updateCategoryWeight(selectedSubject.id, category.id, parseInt(e.target.value || '0'), activeComponentId)}
                    className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.round(category.weight * 100) || 0}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                        if (!isNaN(val) && val >= 0 && val <= 100) {
                          updateCategoryWeight(selectedSubject.id, category.id, val, activeComponentId);
                        }
                      }}
                      className="w-10 text-right bg-transparent text-sm font-bold text-slate-700 outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400 ml-0.5">%</span>
                  </div>
                  <button
                    onClick={() => removeCategory(selectedSubject.id, category.id, activeComponentId)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {isComposite && (
            <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <Info size={16} className="text-indigo-600 shrink-0" />
              <p className="text-[10px] font-medium text-indigo-900 leading-tight">
                Double-click on a component tab to rename it. Each component carries equal weight in the final subject grade calculation.
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

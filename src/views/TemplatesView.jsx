import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Plus, Trash2, Settings, Loader2, RefreshCw, Save } from 'lucide-react';
import { ApiConnectionErrorDisplay } from '../components/ApiConnectionErrorDisplay';

export function TemplatesView({
  subjects, // This is baseSubjects from useSubjectManagement
  syncSubjects, // Function to fetch base subjects
  isLoading, // Loading state for base subjects fetch
  syncError, // Global sync error
  addCategory,
  removeCategory,
  resetSubjectTemplate,
  updateCategoryTitle,
  updateCategoryWeight,
  addColumnToCategory,
  removeColumnFromCategory,
  updateColumnName,
  onUpdateBaseSubject // Pass this from useGradeManagement
}) {
  const location = useLocation();
  const [selectedBaseSubjectId, setSelectedBaseSubjectId] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingColumnIndex, setEditingColumnIndex] = useState(null);
  const [editedColumnName, setEditedColumnName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Set initial selected subject or update when subjects change
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      const stateId = location.state?.subjectId;
      const currentExists = subjects.some(s => String(s.id) === String(selectedBaseSubjectId));
      
      if (stateId && subjects.some(s => String(s.id) === String(stateId))) {
        setSelectedBaseSubjectId(stateId);
      } else if (!selectedBaseSubjectId || !currentExists) {
        setSelectedBaseSubjectId(subjects[0].id);
      }
    }
  }, [subjects, location.state?.subjectId]); // Listen for changes in subjects or incoming navigation state

  const selectedSubject = subjects.find(s => String(s.id) === String(selectedBaseSubjectId));

  const totalWeight = selectedSubject ? (selectedSubject.categories || []).reduce((acc, cat) => acc + (cat.weight || 0), 0) : 0;
  const isWeightValid = Math.round(totalWeight * 100) === 100;

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
        CategoriesJson: selectedSubject.categories, // Send as array, backend handles serialization
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Subject Grading Templates</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Configure grading categories and weights for each subject template.</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="select-template" className="text-xs font-black uppercase text-slate-400">Select Template:</label>
          <select
            id="select-template"
            value={selectedBaseSubjectId}
            onChange={(e) => setSelectedBaseSubjectId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 text-sm"
          >
            {subjects.map((sub, idx) => (
              <option key={sub.id || idx} value={sub.id}>{sub.name} (G{sub.gradeLevel})</option>
            ))}
          </select>
        </div>
      </div>

      {selectedSubject && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black uppercase italic text-slate-800 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" /> {selectedSubject.name} (G{selectedSubject.gradeLevel})
            </h3>
            <div className="flex gap-2">
              <div className="hidden md:flex flex-col items-end justify-center mr-4 pr-4 border-r border-slate-200">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Weight</span>
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
                onClick={() => addCategory(selectedSubject.id)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Plus size={14} /> Add Category
              </button>
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

          <div className="space-y-4">
            {selectedSubject.categories?.map((category, idx) => ( // Line 91:33 is now here, with optional chaining
              <div key={category.id || idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {editingCategoryId === category.id && editingColumnIndex === null ? (
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => updateCategoryTitle(selectedSubject.id, category.id, e.target.value)}
                        onBlur={() => setEditingCategoryId(null)}
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
                        {category.name}
                      </h4>
                    )}
                    <span className="text-xs text-slate-500 font-medium">({(category.weight * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {category.columnNames?.map((colName, colIdx) => (
                      <span key={colIdx} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        {editingCategoryId === category.id && editingColumnIndex === colIdx ? (
                          <input
                            type="text"
                            value={editedColumnName}
                            onChange={(e) => setEditedColumnName(e.target.value)}
                            onBlur={() => {
                              updateColumnName(selectedSubject.id, category.id, colIdx, editedColumnName);
                              setEditingColumnIndex(null);
                              setEditedColumnName('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateColumnName(selectedSubject.id, category.id, colIdx, editedColumnName);
                                setEditingColumnIndex(null);
                                setEditedColumnName('');
                              }
                            }}
                            className="w-16 bg-white border border-indigo-200 rounded-lg px-1 text-[10px] font-bold outline-none"
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
                            {colName}
                          </span>
                        )}
                      </span>
                    ))}
                    <button onClick={() => addColumnToCategory(selectedSubject.id, category.id)} className="text-slate-400 hover:text-indigo-600"><Plus size={14} /></button>
                    {category.columnNames?.length > 1 && (
                      <button onClick={() => removeColumnFromCategory(selectedSubject.id, category.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
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
                    onChange={(e) => updateCategoryWeight(selectedSubject.id, category.id, parseInt(e.target.value))}
                    className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.round(category.weight * 100)}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                        if (!isNaN(val) && val >= 0 && val <= 100) {
                          updateCategoryWeight(selectedSubject.id, category.id, val);
                        }
                      }}
                      className="w-10 text-right bg-transparent text-sm font-bold text-slate-700 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs font-bold text-slate-400 ml-0.5">%</span>
                  </div>
                  <button
                    onClick={() => removeCategory(selectedSubject.id, category.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
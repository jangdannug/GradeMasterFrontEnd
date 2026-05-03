
import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Layout, Plus, Trash2, Save, Columns } from 'lucide-react';

export function TemplatesView({
  subjects,
  students,
  addCategory,
  removeCategory,
  resetSubjectTemplate,
  updateCategoryTitle,
  updateCategoryWeight,
  addColumnToCategory,
  removeColumnFromCategory,
  updateColumnName
}) {
  const location = useLocation();
  const [selectedSubjectId, setSelectedSubjectId] = React.useState(location.state?.subjectId || subjects[0]?.id);

  React.useEffect(() => {
    if (location.state?.subjectId) {
      setSelectedSubjectId(location.state.subjectId);
    }
  }, [location.state?.subjectId]);

  const groupedSubjects = React.useMemo(() => {
    return subjects.reduce((acc, s) => {
      const grade = s.gradeLevel || '7';
      if (!acc[grade]) acc[grade] = [];
      acc[grade].push(s);
      return acc;
    }, {});
  }, [subjects]);

  const sortedGrades = React.useMemo(() => Object.keys(groupedSubjects).sort((a, b) => parseInt(a) - parseInt(b)), [groupedSubjects]);

  const subject = subjects.find(s => s.id === selectedSubjectId);

  if (!subject) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Layout size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tight">Class Record Templates</h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Define grading structure & categories</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select 
            value={selectedSubjectId}
            title="Select subject template"
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {sortedGrades.map(grade => (
              <optgroup key={grade} label={`GRADE ${grade}`}>
                {groupedSubjects[grade].map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase italic">Categories & Weights</h3>
            <button 
              onClick={() => addCategory(subject.id)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Plus size={14} /> Add Category
            </button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {subject.categories.map((cat, idx) => {
              const columnNames = cat.columnNames || [];

              return (
                <div key={cat.id} className="p-6 space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-[300px] flex items-center gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category Name</label>
                        <input 
                          value={cat.name}
                          onChange={(e) => updateCategoryTitle(subject.id, cat.id, e.target.value.toUpperCase())}
                          className="text-lg font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-24">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight (%)</label>
                        <input 
                          type="number"
                          value={Math.round(cat.weight * 100)}
                          onChange={(e) => updateCategoryWeight(subject.id, cat.id, parseInt(e.target.value) || 0)}
                          className="text-lg font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                        />
                      </div>
                      <button 
                        onClick={() => removeCategory(subject.id, cat.id)}
                        className="mt-5 p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Columns size={16} className="text-slate-400" />
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grade Input Columns</h4>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => addColumnToCategory(subject.id, cat.id)}
                          className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-indigo-600 uppercase hover:bg-indigo-50 transition-all"
                        >
                          + Add Column
                        </button>
                        <button 
                          onClick={() => removeColumnFromCategory(subject.id, cat.id)}
                          className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-rose-600 uppercase hover:bg-rose-50 transition-all"
                        >
                          - Remove Last
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2">
                      {columnNames.map((name, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <input 
                            value={name}
                            onChange={(e) => updateColumnName(subject.id, cat.id, i, e.target.value)}
                            className="bg-white border border-slate-200 rounded-md px-2 py-1 text-[10px] font-black text-center text-slate-700 focus:border-indigo-500 outline-none shadow-sm"
                            title={`Column ${i + 1} Name`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
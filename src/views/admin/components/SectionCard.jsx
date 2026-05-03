import React from 'react';
import { History, X, User, ChevronDown } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

export function SectionCard({ 
  section, 
  formData, 
  setFormData, 
  editingSectionId, 
  setEditingSectionId, 
  handleUpdateSection, 
  onDeleteSection, 
  onAssignAdviser, 
  teachers, 
  currentAdviser 
}) {
  const adviserOptions = [
    { value: "", label: "No Adviser Assigned" },
    ...teachers.map(t => ({ value: t.id, label: t.name }))
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between rounded-t-2xl">
        <div>
          <h4 className="font-black text-slate-800 uppercase italic">{section.name}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.schoolYear}</p>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => {
              setEditingSectionId(section.id);
              setFormData({ 
                ...formData,
                name: section.name, 
                gradeLevel: section.gradeLevel,
                schoolYear: section.schoolYear,
                schoolId: section.schoolId,
                schoolName: section.schoolName,
                region: section.region,
                division: section.division
              });
            }}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
            title="Edit Section"
          >
            <History size={16} />
          </button>
          <button 
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete Grade ${section.gradeLevel} - ${section.name}?`)) {
                onDeleteSection(section.id);
              }
            }}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all"
            title="Delete Section"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {editingSectionId === section.id && (
        <div className="p-5 bg-indigo-50/50 border-b border-indigo-100 space-y-4">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Edit Section Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">Grade</label>
              <select 
                value={formData.gradeLevel}
                onChange={e => setFormData({ ...formData, gradeLevel: e.target.value })}
                className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold"
              >
                {['7','8','9','10','11','12'].map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">Section Name</label>
              <input 
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold uppercase"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleUpdateSection(section.id)}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-md shadow-indigo-100"
            >
              Update
            </button>
            <button 
              onClick={() => setEditingSectionId(null)}
              className="px-4 py-2 bg-white text-slate-400 rounded-xl text-[10px] font-black uppercase border border-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adviser Assignment</label>
          <SearchableSelect 
            options={adviserOptions}
            value={section.adviserId}
            onChange={(val) => onAssignAdviser(section.id, val)}
            placeholder="Choose an adviser..."
          />
        </div>
        {currentAdviser && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 mt-auto">
            <div className="size-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm"><User size={16} /></div>
            <div><p className="text-[9px] font-black text-emerald-600 uppercase">Adviser</p><p className="text-xs font-bold text-emerald-900">{currentAdviser.name}</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
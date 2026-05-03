import React from 'react';
import { Mail, X, Check } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

export function RegistrationCard({ reg, form, setApprovalForms, sections, onRejectRegistration, handleApprove }) {
  const isAdviserRole = form.role === 'adviser';
  const isApproveDisabled = isAdviserRole && !form.sectionId;

  const sectionOptions = [
    { value: "", label: "No Class Assignment" },
    ...[...sections]
      .sort((a,b) => parseInt(a.gradeLevel) - parseInt(b.gradeLevel))
      .map(s => ({ value: s.id, label: `Grade ${s.gradeLevel} - ${s.name}` }))
  ];

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-100 shadow-sm flex flex-col md:flex-row">
      <div className="p-6 md:w-1/3 bg-amber-50/50 border-b md:border-b-0 md:border-r border-amber-100 space-y-4 rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100 shrink-0">
            <Mail size={24} />
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-slate-800 uppercase italic leading-tight">{reg.name}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{reg.username}</p>
          </div>
        </div>
        <button 
          onClick={() => onRejectRegistration(reg.id)}
          className="w-full py-2 flex items-center justify-center gap-2 text-rose-500 hover:bg-rose-50 rounded-xl text-[10px] font-black uppercase transition-colors"
        >
          <X size={14} /> Reject Application
        </button>
      </div>
      <div className="p-6 md:flex-1 space-y-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Assign Role</label>
            <select 
              value={form.role}
              onChange={e => setApprovalForms(prev => ({ ...prev, [reg.id]: { ...form, role: e.target.value }}))}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700"
            >
              <option value="teacher">TEACHER</option>
              <option value="adviser">ADVISER</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              Primary Class {isAdviserRole ? (
                <span className="text-rose-500">*</span>
              ) : (
                <span className="text-slate-300 font-medium lowercase">(Optional)</span>
              )}
            </label>
            <SearchableSelect 
              options={sectionOptions}
              value={form.sectionId}
              onChange={(val) => setApprovalForms(prev => ({ 
                ...prev, 
                [reg.id]: { ...form, sectionId: val }
              }))}
              error={isApproveDisabled}
              placeholder="Search for a class..."
            />
          </div>
        </div>
        <button 
          onClick={() => handleApprove(reg.id)}
          disabled={isApproveDisabled}
          className={`w-full py-3 ${isApproveDisabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'} rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-lg mt-2`}
        >
          <Check size={14} /> Approve & Onboard User
        </button>
      </div>
    </div>
  );
}
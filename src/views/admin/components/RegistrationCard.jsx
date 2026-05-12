import React from 'react';
import { Mail, X, Check, GraduationCap } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import schoolService from '../../../services/schoolService';

export function RegistrationCard({ reg, form, setApprovalForms, sections, onRejectRegistration, handleApprove, currentUserRole }) {
  const isAdviserRole = form.role === 'adviser';
  const isApproveDisabled = isAdviserRole && !form.sectionId;

  const sectionOptions = [
    { value: "", label: "No Class Assignment" },
    ...[...sections]
      .sort((a,b) => parseInt(a.gradeLevel) - parseInt(b.gradeLevel))
      .map(s => ({ value: s.id, label: `Grade ${s.gradeLevel} - ${s.name}` }))
  ];

  const [schoolName, setSchoolName] = React.useState('Loading...');

  React.useEffect(() => {
    const fetchSchoolName = async () => {
      if (reg.schoolId) {
        try {
          const schools = await schoolService.getSchools();
          const school = schools.find(s => String(s.id) === String(reg.schoolId));
          setSchoolName(school?.name || `Unknown School (ID: ${reg.schoolId})`);
        } catch (error) { setSchoolName(`Error loading school (ID: ${reg.schoolId})`); }
      } else { setSchoolName('No School ID provided'); }
    };
    fetchSchoolName();
  }, [reg.schoolId]);

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-100 shadow-sm flex flex-col md:flex-row">
      <div className="p-6 md:w-2/5 lg:w-1/3 bg-amber-50/50 border-b md:border-b-0 md:border-r border-amber-100 space-y-4 rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100 shrink-0">
            <Mail size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-black text-slate-800 uppercase italic leading-tight break-words whitespace-normal flex items-center gap-2">
              {reg.name}
              {(reg.requestedRole || reg.requested_role) && (
                <span className="not-italic text-[7px] font-black bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded shadow-sm">
                  {reg.requestedRole || reg.requested_role}
                </span>
              )}
            </h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mb-1">{reg.username}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <GraduationCap size={10} className="text-slate-400" /> {schoolName}
            </p>
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
              <option value="admin">ADMIN</option>
              <option value="teacher">TEACHER</option>
              <option value="adviser">ADVISER</option>
            </select>
          </div>
          {isAdviserRole && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Primary Class <span className="text-rose-500">*</span>
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
          )}
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